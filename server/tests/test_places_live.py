"""UC-04 on Google Places, with saved responses: no network, no key, no quota spent."""

import asyncio
import json
import logging
from pathlib import Path

import pytest

from hermes_api.errors import NotFound, UpstreamUnavailable
from hermes_api.features.places import live
from hermes_api.features.places.live import GooglePlaceProvider
from hermes_api.features.places.mock import MockPlaceProvider
from hermes_api.features.places.provider import get_place_provider

SAVED = Path(__file__).parent / "google"
AUTOCOMPLETE = json.loads((SAVED / "autocomplete_lisbo.json").read_text())
DETAILS = json.loads((SAVED / "details_lisbon.json").read_text())
LISBON = "google:ChIJO_PkYRozGQ0R0DaQ5L3rAAQ"


class FakeGoogle:
    """Answers like Google and records every call."""

    def __init__(self, status=200, autocomplete=AUTOCOMPLETE, details=DETAILS):
        self.status, self.autocomplete, self.details = status, autocomplete, details
        self.calls = []

    async def __call__(self, method, url, headers, body):
        self.calls.append((method, url, headers, body))
        await asyncio.sleep(0)  # Let requests overlap, as they would on a real server.
        if self.status != 200:
            return self.status, {"error": {"status": "RESOURCE_EXHAUSTED"}}
        return 200, self.autocomplete if method == "POST" else self.details


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def provider(google=None, clock=None):
    return GooglePlaceProvider("test-key", send=google or FakeGoogle(), clock=clock or Clock())


def run(coroutine):
    return asyncio.run(coroutine)


def test_search_maps_google_suggestions_to_places():
    places = run(provider().search("Lisbo"))
    assert [(p.id, p.name, p.region) for p in places[:2]] == [
        (LISBON, "Lisbon", "Portugal"),
        ("google:ChIJmblDvuICNIgRGiNj3M7-ZRY", "Lisbon", "OH, USA"),
    ]
    assert len(places) <= 5


def test_search_asks_for_regions_and_sends_the_key_in_a_header_not_the_url():
    google = FakeGoogle()
    run(provider(google).search("Lisbo"))
    method, url, headers, body = google.calls[0]
    assert method == "POST" and "test-key" not in url
    assert headers["X-Goog-Api-Key"] == "test-key"
    assert body == {"input": "lisbo", "includedPrimaryTypes": ["(regions)"]}


def test_short_searches_never_reach_google():
    google = FakeGoogle()
    places = provider(google)
    assert run(places.search("")) == []
    assert run(places.search(" l ")) == []
    assert google.calls == []


def test_the_same_search_is_asked_once_even_typed_differently():
    google = FakeGoogle()
    places = provider(google)
    run(places.search("Lisbo"))
    run(places.search("  lisbo "))
    assert len(google.calls) == 1


def test_cached_answers_expire():
    google, clock = FakeGoogle(), Clock()
    places = provider(google, clock)
    run(places.search("lisbo"))
    clock.now += live.CACHE_SECONDS + 1
    run(places.search("lisbo"))
    assert len(google.calls) == 2


def test_identical_searches_at_the_same_time_share_one_call():
    google = FakeGoogle()
    places = provider(google)

    async def together():
        return await asyncio.gather(*(places.search("lisbo") for _ in range(5)))

    results = run(together())
    assert len(google.calls) == 1
    assert all(result == results[0] for result in results)


def test_postal_codes_are_left_out():
    google = FakeGoogle(
        autocomplete={
            "suggestions": [
                {
                    "placePrediction": {
                        "placeId": "zip",
                        "structuredFormat": {"mainText": {"text": "1100"}},
                        "types": ["postal_code"],
                    }
                }
            ]
        }
    )
    assert run(provider(google).search("1100")) == []


def test_calls_stop_at_the_limit_per_minute():
    google, clock = FakeGoogle(), Clock()
    places = provider(google, clock)
    for n in range(live.CALLS_PER_MINUTE):
        run(places.search(f"place {n}"))
    with pytest.raises(UpstreamUnavailable, match="busy"):
        run(places.search("one more"))
    clock.now += 61
    run(places.search("one more"))
    assert len(google.calls) == live.CALLS_PER_MINUTE + 1


def test_google_quota_running_out_shows_busy():
    with pytest.raises(UpstreamUnavailable, match="busy"):
        run(provider(FakeGoogle(status=429)).search("lisbo"))


def test_a_failed_search_is_not_cached():
    google = FakeGoogle(status=503)
    places = provider(google)
    with pytest.raises(UpstreamUnavailable):
        run(places.search("lisbo"))
    google.status = 200
    assert run(places.search("lisbo"))
    assert len(google.calls) == 2


def test_get_reads_cheap_details_once():
    google = FakeGoogle()
    places = provider(google)
    place = run(places.get(LISBON))
    run(places.get(LISBON))
    assert (place.id, place.name, place.region) == (LISBON, "Lisbon", "Portugal")
    assert (place.latitude, place.longitude) == (38.7222524, -9.1393366)
    assert len(google.calls) == 1
    method, url, headers, _ = google.calls[0]
    assert method == "GET" and url.endswith("/places/ChIJO_PkYRozGQ0R0DaQ5L3rAAQ")
    assert "displayName" not in headers["X-Goog-FieldMask"]


def test_region_falls_back_to_the_whole_address():
    details = {"id": "x", "formattedAddress": "Kanto, Japan", "addressComponents": []}
    place = run(provider(FakeGoogle(details=details)).get("google:x"))
    assert (place.name, place.region) == ("Kanto", "Japan")


def test_sample_ids_still_open():
    google = FakeGoogle()
    assert run(provider(google).get("lisbon")).name == "Lisbon"
    assert google.calls == []


@pytest.mark.parametrize("place_id", ["viator:123", "google:a/b"])
def test_ids_from_elsewhere_are_not_found(place_id):
    with pytest.raises(NotFound):
        run(provider().get(place_id))


def test_unknown_google_place_is_not_found():
    with pytest.raises(NotFound):
        run(provider(FakeGoogle(status=404)).get("google:gone"))


def test_without_a_key_it_warns_and_uses_sample_data(caplog):
    with caplog.at_level(logging.WARNING):
        chosen = get_place_provider()
    assert isinstance(chosen, MockPlaceProvider)
    assert "GOOGLE_PLACES_API_KEY is not set" in caplog.text


def test_with_a_key_it_uses_google(monkeypatch):
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "test-key")
    from hermes_api.config import get_settings

    get_settings.cache_clear()
    assert isinstance(get_place_provider(), GooglePlaceProvider)


def test_the_route_returns_google_places(app, client):
    google = FakeGoogle()
    app.dependency_overrides[get_place_provider] = lambda: provider(google)
    response = client.get("/places/search", params={"q": "Lisbo"})
    assert response.status_code == 200
    assert response.json()[0] == {
        "id": LISBON,
        "name": "Lisbon",
        "region": "Portugal",
        "latitude": None,
        "longitude": None,
    }
