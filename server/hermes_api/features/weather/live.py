"""UC-07 View Weather, live, from Open-Meteo (https://open-meteo.com). It needs no API key.

Days inside Open-Meteo's forecast window come from its forecast. Days outside it (further ahead, or
more than 92 days ago) are "typical": the average of the same calendar day in the last few years,
from Open-Meteo's historical archive, and they are marked `is_typical`.

Nothing is invented. A day the source has no value for is left out, and when no day at all comes
back the request fails with a message people can read, so the app never shows a made-up forecast.
"""

import asyncio
from collections import Counter
from collections.abc import Awaitable, Callable
from datetime import date, timedelta
from typing import Any

from ...errors import ApiError, UpstreamUnavailable
from ...outbound import get_json
from ..places.provider import PlaceProvider, get_place_provider
from .models import CurrentWeather, DailyWeather, WeatherCondition

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
SERVICE = "The weather service"

# Open-Meteo forecasts up to 16 days: today and the 15 days after it. It can also report up to
# 92 days back. Any other day gets typical weather.
FORECAST_DAYS = 16
PAST_DAYS = 92
# How many past years are averaged for a typical day.
TYPICAL_YEARS = 3

DAILY_VARIABLES = "weather_code,temperature_2m_max,temperature_2m_min"

Fetch = Callable[..., Awaitable[Any]]
# (high, low, condition) for one day.
Reading = tuple[float, float, WeatherCondition]

# WMO weather codes, as Open-Meteo reports them. The app draws three conditions, so every kind of
# precipitation (drizzle, rain, snow, showers, thunderstorms) is "rainy". Fog is "cloudy".
_SUNNY = {0, 1}
_CLOUDY = {2, 3, 45, 48}
_RAINY = {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99}


def condition_for(code: object) -> WeatherCondition | None:
    """The app's condition for a WMO code, or None for a missing or unknown code."""
    if not isinstance(code, int | float):
        return None
    if code in _SUNNY:
        return "sunny"
    if code in _CLOUDY:
        return "cloudy"
    if code in _RAINY:
        return "rainy"
    return None


def same_day_in_year(day: date, year: int) -> date:
    """The same month and day in another year. 29 February becomes 28 February."""
    try:
        return day.replace(year=year)
    except ValueError:
        return day.replace(year=year, day=28)


def parse_daily(data: Any) -> dict[date, Reading]:
    """Reads Open-Meteo's `daily` block. Days with a missing value are left out."""
    try:
        daily = data["daily"]
        rows = zip(
            daily["time"],
            daily["temperature_2m_max"],
            daily["temperature_2m_min"],
            daily["weather_code"],
            strict=True,
        )
        readings: dict[date, Reading] = {}
        for time, high, low, code in rows:
            condition = condition_for(code)
            if isinstance(high, int | float) and isinstance(low, int | float) and condition:
                readings[date.fromisoformat(time)] = (high, low, condition)
        return readings
    except (KeyError, TypeError, ValueError) as error:
        raise UpstreamUnavailable(
            f"{SERVICE} sent something unexpected. Try again soon."
        ) from error


def typical_reading(per_year: list[Reading]) -> Reading:
    """Average high and low, and the most common condition. A tie goes to the latest year."""
    highs, lows, conditions = zip(*per_year, strict=True)
    condition = Counter(conditions).most_common(1)[0][0]
    return round(sum(highs) / len(highs)), round(sum(lows) / len(lows)), condition


class LiveWeatherProvider:
    def __init__(
        self,
        *,
        fetch: Fetch = get_json,
        today: Callable[[], date] = date.today,
        places: PlaceProvider | None = None,
    ):
        # All three can be replaced in tests, so they need no network.
        self._fetch = fetch
        self._today = today
        self._places = places

    async def current(self, place_id: str) -> CurrentWeather:
        latitude, longitude = await self._coordinates(place_id)
        data = await self._fetch(
            FORECAST_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,weather_code",
                "temperature_unit": "fahrenheit",
                "timezone": "auto",
            },
            service=SERVICE,
        )
        try:
            temperature = data["current"]["temperature_2m"]
            condition = condition_for(data["current"]["weather_code"])
        except (KeyError, TypeError) as error:
            raise UpstreamUnavailable(f"{SERVICE} sent something unexpected.") from error
        if not isinstance(temperature, int | float) or condition is None:
            raise UpstreamUnavailable("The weather there isn't available right now.")
        return CurrentWeather(temperature=round(temperature), condition=condition)

    async def daily(self, place_id: str, start: date, end: date) -> list[DailyWeather]:
        latitude, longitude = await self._coordinates(place_id)
        today = self._today()
        first_forecast = today - timedelta(days=PAST_DAYS)
        last_forecast = today + timedelta(days=FORECAST_DAYS - 1)

        days = [start + timedelta(days=i) for i in range((end - start).days + 1)]
        forecast_days = [day for day in days if first_forecast <= day <= last_forecast]
        typical_days = [day for day in days if not first_forecast <= day <= last_forecast]

        forecast, typical = await asyncio.gather(
            self._forecast(latitude, longitude, forecast_days),
            self._typical(latitude, longitude, typical_days, today.year),
        )

        weather = [
            DailyWeather(date=day, high=high, low=low, condition=condition, is_typical=False)
            for day, (high, low, condition) in forecast.items()
        ] + [
            DailyWeather(date=day, high=high, low=low, condition=condition, is_typical=True)
            for day, (high, low, condition) in typical.items()
        ]
        if days and not weather:
            raise UpstreamUnavailable("The weather for those dates isn't available right now.")
        return sorted(weather, key=lambda day: day.date)

    async def _coordinates(self, place_id: str) -> tuple[float, float]:
        place = await (self._places or get_place_provider()).get(place_id)  # NotFound passes on
        if place.latitude is None or place.longitude is None:
            raise ApiError("We don't have weather for that place.")
        return place.latitude, place.longitude

    async def _daily_block(
        self, url: str, latitude: float, longitude: float, start: date, end: date
    ) -> dict[date, Reading]:
        data = await self._fetch(
            url,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "daily": DAILY_VARIABLES,
                "temperature_unit": "fahrenheit",
                "timezone": "auto",
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            service=SERVICE,
        )
        return parse_daily(data)

    async def _forecast(
        self, latitude: float, longitude: float, days: list[date]
    ) -> dict[date, Reading]:
        if not days:
            return {}
        readings = await self._daily_block(FORECAST_URL, latitude, longitude, days[0], days[-1])
        return {day: readings[day] for day in days if day in readings}

    async def _typical(
        self, latitude: float, longitude: float, days: list[date], this_year: int
    ) -> dict[date, Reading]:
        if not days:
            return {}
        # Newest year first, so a tie in `typical_reading` goes to the latest year.
        years = [this_year - n for n in range(1, TYPICAL_YEARS + 1)]

        async def one_year(year: int) -> dict[date, Reading]:
            sources = [same_day_in_year(day, year) for day in days]
            return await self._daily_block(
                ARCHIVE_URL, latitude, longitude, min(sources), max(sources)
            )

        by_year = await asyncio.gather(*(one_year(year) for year in years))
        typical: dict[date, Reading] = {}
        for day in days:
            found = [
                readings[source]
                for year, readings in zip(years, by_year, strict=True)
                if (source := same_day_in_year(day, year)) in readings
            ]
            if found:
                typical[day] = typical_reading(found)
        return typical
