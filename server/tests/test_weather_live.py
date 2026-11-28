"""UC-07 View Weather, live provider. Offline: Open-Meteo is replaced by FakeOpenMeteo, which
answers in the same shape as the real service.

RL-TC03  forecast days and typical days are told apart, and typical days come from past years
RL-TC04  when the weather service fails or has nothing, the app gets an error and no forecast
"""

import asyncio
from datetime import date, timedelta

import pytest

from hermes_api.errors import UpstreamUnavailable
from hermes_api.features.places.mock import MockPlaceProvider
from hermes_api.features.places.models import Place
from hermes_api.features.weather.live import (
    ARCHIVE_URL,
    FORECAST_URL,
    LiveWeatherProvider,
    condition_for,
    same_day_in_year,
)
from hermes_api.features.weather.provider import get_weather_provider

TODAY = date(2026, 11, 27)  # the forecast covers 27 Nov to 12 Dec 2026

# What the archive reports for the same day in each past year: (high, low, WMO code).
ARCHIVE_YEARS = {2025: (50, 40, 0), 2024: (56, 44, 3), 2023: (53, 39, 61)}


class FakeOpenMeteo:
    """Stands in for `get_json`. Remembers every request."""

    def __init__(self, *, forecast_gaps=(), error=None):
        self.calls: list[tuple[str, dict]] = []
        self.forecast_gaps = set(forecast_gaps)
        self.error = error

    async def __call__(self, url, *, params=None, service):
        self.calls.append((url, params))
        if self.error:
            raise self.error
        start, end = (
            date.fromisoformat(params["start_date"]),
            date.fromisoformat(params["end_date"]),
        )
        days = [start + timedelta(days=i) for i in range((end - start).days + 1)]
        if url == FORECAST_URL:
            return daily_block(
                days, lambda d: (None if d in self.forecast_gaps else 40 + d.day, 30, 1)
            )
        return daily_block(days, lambda d: ARCHIVE_YEARS[d.year])


def daily_block(days, reading):
    rows = [reading(day) for day in days]
    return {
        "daily": {
            "time": [day.isoformat() for day in days],
            "temperature_2m_max": [row[0] for row in rows],
            "temperature_2m_min": [row[1] for row in rows],
            "weather_code": [row[2] for row in rows],
        }
    }


class NoCoordinates:
    async def get(self, place_id):
        return Place(id=place_id, name="Nowhere", region="Nowhere")

    async def search(self, query):
        return []


@pytest.fixture
def live(app):
    """The app wired to the live provider, with Open-Meteo replaced. Returns (client, fake)."""
    from fastapi.testclient import TestClient

    def wire(fake=None, places=None):
        fake = fake or FakeOpenMeteo()
        provider = LiveWeatherProvider(
            fetch=fake, today=lambda: TODAY, places=places or MockPlaceProvider()
        )
        app.dependency_overrides[get_weather_provider] = lambda: provider
        return TestClient(app), fake

    return wire


def daily(client, start, end, place="lisbon"):
    return client.get(f"/places/{place}/weather/daily", params={"start": start, "end": end})


# --- RL-TC03 -------------------------------------------------------------------------------


def test_rl_tc03_forecast_days_and_typical_days_are_told_apart(live):
    client, fake = live()

    # 10 to 14 December: the 10th, 11th and 12th are in the forecast; the 13th and 14th are not.
    response = daily(client, "2026-12-10", "2026-12-14")

    assert response.status_code == 200
    days = response.json()
    assert [d["date"] for d in days] == [f"2026-12-{n}" for n in range(10, 15)]
    assert [d["isTypical"] for d in days] == [False, False, False, True, True]

    # A forecast day carries the forecast: high 40 + day of the month, low 30, code 1 = sunny.
    assert days[0] == {
        "date": "2026-12-10",
        "high": 50,
        "low": 30,
        "condition": "sunny",
        "isTypical": False,
    }
    # A typical day averages 2025, 2024 and 2023: highs 50, 56, 53 -> 53; lows 40, 44, 39 -> 41.
    # The conditions are sunny, cloudy and rainy once each, so the latest year (sunny) decides.
    assert days[3] == {
        "date": "2026-12-13",
        "high": 53,
        "low": 41,
        "condition": "sunny",
        "isTypical": True,
    }

    # One forecast request for the forecast days; one archive request for each of the last 3 years,
    # each asking for the same calendar days in that year.
    forecast_calls = [p for url, p in fake.calls if url == FORECAST_URL]
    archive_calls = [p for url, p in fake.calls if url == ARCHIVE_URL]
    assert [(p["start_date"], p["end_date"]) for p in forecast_calls] == [
        ("2026-12-10", "2026-12-12")
    ]
    assert sorted((p["start_date"], p["end_date"]) for p in archive_calls) == [
        ("2023-12-13", "2023-12-14"),
        ("2024-12-13", "2024-12-14"),
        ("2025-12-13", "2025-12-14"),
    ]
    # Temperatures are asked for in Fahrenheit, at the place's coordinates (Lisbon).
    assert forecast_calls[0]["temperature_unit"] == "fahrenheit"
    assert (forecast_calls[0]["latitude"], forecast_calls[0]["longitude"]) == (38.72, -9.14)


def test_a_range_inside_the_forecast_makes_no_archive_request(live):
    client, fake = live()
    days = daily(client, "2026-11-27", "2026-12-12").json()
    assert len(days) == 16
    assert not any(d["isTypical"] for d in days)
    assert [url for url, _ in fake.calls] == [FORECAST_URL]


# --- RL-TC04 -------------------------------------------------------------------------------


def test_rl_tc04_an_outage_is_a_readable_error_with_no_forecast(live):
    outage = UpstreamUnavailable("The weather service is not responding. Try again soon.")
    client, _ = live(FakeOpenMeteo(error=outage))

    for response in (
        daily(client, "2026-12-10", "2026-12-11"),  # forecast days
        daily(client, "2027-03-10", "2027-03-11"),  # typical days
        client.get("/places/lisbon/weather/current"),
    ):
        assert response.status_code == 503
        assert response.json() == {
            "error": "The weather service is not responding. Try again soon."
        }


def test_rl_tc04_a_range_with_no_usable_data_is_an_error_not_an_empty_forecast(live):
    # The source answers, but has no temperature for the only day asked for.
    client, _ = live(FakeOpenMeteo(forecast_gaps={date(2026, 12, 10)}))
    response = daily(client, "2026-12-10", "2026-12-10")
    assert response.status_code == 503
    assert response.json() == {"error": "The weather for those dates isn't available right now."}


def test_a_day_with_a_missing_value_is_left_out_not_filled_in(live):
    client, _ = live(FakeOpenMeteo(forecast_gaps={date(2026, 12, 11)}))
    days = daily(client, "2026-12-10", "2026-12-12").json()
    assert [d["date"] for d in days] == ["2026-12-10", "2026-12-12"]


# --- Smaller checks ------------------------------------------------------------------------


def test_current_weather_is_rounded_and_in_fahrenheit(live):
    class Current(FakeOpenMeteo):
        async def __call__(self, url, *, params=None, service):
            self.calls.append((url, params))
            return {"current": {"temperature_2m": 63.6, "weather_code": 2}}

    client, fake = live(Current())
    assert client.get("/places/lisbon/weather/current").json() == {
        "temperature": 64,
        "condition": "cloudy",
    }
    assert fake.calls[0][1]["temperature_unit"] == "fahrenheit"


@pytest.mark.parametrize(
    ("code", "condition"),
    [
        (0, "sunny"),
        (1, "sunny"),
        (3, "cloudy"),
        (45, "cloudy"),
        (61, "rainy"),
        (75, "rainy"),
        (95, "rainy"),
    ],
)
def test_weather_codes_map_to_the_apps_three_conditions(code, condition):
    assert condition_for(code) == condition


@pytest.mark.parametrize("code", [None, "sunny", 4, 100])
def test_unknown_weather_codes_are_not_guessed(code):
    assert condition_for(code) is None


def test_29_february_uses_28_february_in_a_year_without_one():
    assert same_day_in_year(date(2028, 2, 29), 2025) == date(2025, 2, 28)
    assert same_day_in_year(date(2028, 2, 29), 2024) == date(2024, 2, 29)


def test_unknown_place_is_a_404_and_a_place_without_coordinates_is_a_readable_error(live):
    client, fake = live()
    assert daily(client, "2026-12-10", "2026-12-10", place="atlantis").status_code == 404

    client, fake = live(places=NoCoordinates())
    response = daily(client, "2026-12-10", "2026-12-10")
    assert response.status_code == 400
    assert response.json() == {"error": "We don't have weather for that place."}
    assert fake.calls == []  # nothing was asked of Open-Meteo


def test_the_live_provider_is_the_default_one():
    assert isinstance(get_weather_provider(), LiveWeatherProvider)


def test_provider_can_be_called_directly():
    provider = LiveWeatherProvider(
        fetch=FakeOpenMeteo(), today=lambda: TODAY, places=MockPlaceProvider()
    )
    days = asyncio.run(provider.daily("lisbon", date(2026, 12, 12), date(2026, 12, 13)))
    assert [(d.date, d.is_typical) for d in days] == [
        (date(2026, 12, 12), False),
        (date(2026, 12, 13), True),
    ]
