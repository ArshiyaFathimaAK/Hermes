"""UC-06 lodging on LiteAPI, with saved responses: no network, no key, no quota spent."""

import asyncio
import json
import logging
from datetime import date
from pathlib import Path

import pytest

from hermes_api.errors import NotFound, UpstreamUnavailable
from hermes_api.features.places.mock import MockPlaceProvider
from hermes_api.features.stays import live
from hermes_api.features.stays.live import LiteApiStayProvider
from hermes_api.features.stays.mock import MockStayProvider
from hermes_api.features.stays.models import StayDates
from hermes_api.features.stays.provider import get_stay_provider

SAVED = Path(__file__).parent / "liteapi"
HOTELS = json.loads((SAVED / "hotels_kyoto.json").read_text())
RATES = json.loads((SAVED / "rates_kyoto_2_nights.json").read_text())
TWO_NIGHTS = StayDates(check_in=date(2027, 1, 12), check_out=date(2027, 1, 14))
NOHGA = "liteapi:lp65574fa9"
BLOSSOM = "liteapi:lp6557b9a5"


class FakeLiteApi:
    """Answers like LiteAPI and records every call."""

    def __init__(self, hotels=HOTELS, rates=RATES, status=200):
        self.hotels, self.rates, self.status = hotels, rates, status
        self.calls = []

    async def __call__(self, method, url, headers, query, body):
        self.calls.append((method, url, headers, query, body))
        await asyncio.sleep(0)
        if self.status != 200:
            return self.status, {"error": {"code": 0, "message": "nope"}}
        return 200, self.rates if method == "POST" else self.hotels


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def provider(api=None, clock=None):
    return LiteApiStayProvider(
        "test-key", places=MockPlaceProvider(), send=api or FakeLiteApi(), clock=clock or Clock()
    )


def run(coroutine):
    return asyncio.run(coroutine)


def by_id(stays):
    return {s.id: s for s in stays}


def test_lists_hotels_near_the_place_with_what_liteapi_knows():
    stays = by_id(run(provider().list_for_place("kyoto")))
    nohga = stays[NOHGA]
    assert nohga.name == "NOHGA HOTEL KIYOMIZU KYOTO"
    assert (nohga.place_id, nohga.kind) == ("kyoto", "Hotel")
    assert (nohga.score, nohga.score_word, nohga.review_count) == (9.6, "Wonderful", "5,056")
    assert nohga.amenities == ["Wi-Fi"]
    # Not known here, so left out rather than made up.
    assert nohga.near is None and nohga.area is None
    # No dates: no price.
    assert nohga.nightly is None


def test_asks_near_the_place_and_sends_the_key_in_a_header():
    api = FakeLiteApi()
    run(provider(api).list_for_place("kyoto"))
    method, url, headers, query, _ = api.calls[0]
    assert method == "GET" and "test-key" not in url
    assert headers["X-API-Key"] == "test-key"
    assert (query["latitude"], query["longitude"]) == (35.01, 135.77)
    assert query["limit"] == live.MAX_STAYS


def test_prices_are_per_night_for_the_dates():
    api = FakeLiteApi()
    stays = by_id(run(provider(api).list_for_place("kyoto", TWO_NIGHTS)))
    assert stays[NOHGA].nightly == 101.88  # 203.76 for two nights
    assert stays[NOHGA].free_cancellation is False
    assert stays[BLOSSOM].free_cancellation is True
    _, _, _, _, body = api.calls[1]
    assert (body["checkin"], body["checkout"]) == ("2027-01-12", "2027-01-14")
    assert body["occupancies"] == [{"adults": 2}] and body["currency"] == "USD"
    assert len(api.calls) == 2  # One list, one price call for every hotel.


def test_hotels_without_a_room_are_left_out_for_those_dates():
    rates = {"data": [h for h in RATES["data"] if h["hotelId"] == "lp65574fa9"]}
    stays = run(provider(FakeLiteApi(rates=rates)).list_for_place("kyoto", TWO_NIGHTS))
    assert [s.id for s in stays] == [NOHGA]


def test_no_availability_at_all_is_an_empty_list():
    class NoRooms(FakeLiteApi):
        async def __call__(self, method, url, headers, query, body):
            if method == "POST":
                return 400, {"error": {"code": 2001, "description": "no availability found"}}
            return await super().__call__(method, url, headers, query, body)

    assert run(provider(NoRooms()).list_for_place("kyoto", TWO_NIGHTS)) == []


def test_pins_follow_real_positions_with_north_at_the_top():
    stays = by_id(run(provider().list_for_place("kyoto")))
    north = stays["liteapi:lp6555d2ae"].map_position  # 35.006, the furthest north
    south = stays[NOHGA].map_position  # 34.995, the furthest south
    assert north.y == 0.1 and south.y == 0.9
    assert all(0.1 <= s.map_position.x <= 0.9 for s in stays.values())


def test_the_same_list_and_prices_are_asked_for_once():
    api = FakeLiteApi()
    stays = provider(api)
    run(stays.list_for_place("kyoto", TWO_NIGHTS))
    run(stays.list_for_place("kyoto", TWO_NIGHTS))
    assert len(api.calls) == 2


def test_prices_are_asked_again_after_half_an_hour_but_hotels_are_kept():
    api, clock = FakeLiteApi(), Clock()
    stays = provider(api, clock)
    run(stays.list_for_place("kyoto", TWO_NIGHTS))
    clock.now += live.PRICES_SECONDS + 1
    run(stays.list_for_place("kyoto", TWO_NIGHTS))
    assert [call[0] for call in api.calls] == ["GET", "POST", "POST"]


def test_identical_requests_at_the_same_time_share_calls():
    api = FakeLiteApi()
    stays = provider(api)

    async def together():
        return await asyncio.gather(*(stays.list_for_place("kyoto", TWO_NIGHTS) for _ in range(4)))

    run(together())
    assert len(api.calls) == 2


def test_get_many_uses_hotels_already_listed():
    api = FakeLiteApi()
    stays = provider(api)
    run(stays.list_for_place("kyoto"))
    found = run(stays.get_many([NOHGA]))
    assert [s.id for s in found] == [NOHGA]
    assert len(api.calls) == 1


def test_get_many_leaves_out_hotels_liteapi_no_longer_has():
    api = FakeLiteApi(hotels={"data": []})
    assert run(provider(api).get_many(["liteapi:gone"])) == []


def test_get_many_looks_up_hotels_it_has_not_seen_in_one_call():
    api = FakeLiteApi()
    found = run(provider(api).get_many([NOHGA, BLOSSOM], TWO_NIGHTS))
    assert {s.id for s in found} == {NOHGA, BLOSSOM}
    assert api.calls[0][3] == {"hotelIds": "lp65574fa9,lp6557b9a5"}
    assert by_id(found)[NOHGA].nightly == 101.88
    assert by_id(found)[NOHGA].place_id is None  # Looked up by id alone.


def test_saved_sample_stays_still_show():
    api = FakeLiteApi()
    found = run(provider(api).get_many(["river"]))
    assert [s.name for s in found] == [s.name for s in run(MockStayProvider().get_many(["river"]))]
    assert api.calls == []


def test_an_unknown_place_is_not_found():
    with pytest.raises(NotFound):
        run(provider().list_for_place("atlantis"))


@pytest.mark.parametrize(("status", "message"), [(429, "busy"), (401, "not responding")])
def test_liteapi_failures_have_readable_messages(status, message):
    with pytest.raises(UpstreamUnavailable, match=message):
        run(provider(FakeLiteApi(status=status)).list_for_place("kyoto"))


def test_calls_stop_at_the_limit_per_minute():
    api, clock = FakeLiteApi(), Clock()
    stays = provider(api, clock)
    for n in range(live.CALLS_PER_MINUTE):
        run(stays.get_many([f"liteapi:h{n}"]))
    with pytest.raises(UpstreamUnavailable, match="busy"):
        run(stays.get_many(["liteapi:one-more"]))
    clock.now += 61
    run(stays.get_many(["liteapi:one-more"]))


def test_unknown_hotel_types_and_scores_are_hidden():
    hotel = {"id": "x", "name": "Camp", "hotelTypeId": 214, "rating": 0, "reviewCount": 0}
    stay = live.stay_from_hotel(hotel, "kyoto")
    assert (stay.kind, stay.score, stay.score_word, stay.review_count) == (None, None, None, None)


def test_without_a_key_it_warns_and_uses_sample_stays(caplog):
    with caplog.at_level(logging.WARNING):
        chosen = get_stay_provider()
    assert isinstance(chosen, MockStayProvider)
    assert "LITEAPI_API_KEY is not set" in caplog.text


def test_the_route_sends_dates_and_leaves_out_unknown_fields(app, client):
    api = FakeLiteApi()
    app.dependency_overrides[get_stay_provider] = lambda: provider(api)
    response = client.get(
        "/places/kyoto/stays", params={"checkIn": "2027-01-12", "checkOut": "2027-01-14"}
    )
    assert response.status_code == 200
    first = by_id_json(response.json())[NOHGA]
    assert first["nightly"] == 101.88 and first["freeCancellation"] is False
    assert "near" not in first and "area" not in first


def by_id_json(stays):
    return {s["id"]: s for s in stays}


@pytest.mark.parametrize(
    "params",
    [
        {"checkIn": "2027-01-12"},
        {"checkIn": "2027-01-14", "checkOut": "2027-01-12"},
        {"checkIn": "2027-01-01", "checkOut": "2027-03-01"},
    ],
)
def test_bad_dates_are_refused_before_asking_anyone(client, params):
    response = client.get("/places/kyoto/stays", params=params)
    assert response.status_code == 400
    assert "error" in response.json()


def test_trip_cost_prices_stays_for_the_trip_dates(app, client):
    api = FakeLiteApi()
    app.dependency_overrides[get_stay_provider] = lambda: provider(api)
    estimate = client.post(
        "/costs/estimate",
        json={"stayIds": [NOHGA], "nights": 2, "checkIn": "2027-01-12", "checkOut": "2027-01-14"},
    ).json()
    assert estimate["lodging"] == pytest.approx(203.76)


def test_trip_cost_without_dates_adds_nothing_for_unpriced_stays(app, client):
    app.dependency_overrides[get_stay_provider] = lambda: provider(FakeLiteApi())
    estimate = client.post("/costs/estimate", json={"stayIds": [NOHGA], "nights": 2}).json()
    assert estimate["lodging"] == 0
