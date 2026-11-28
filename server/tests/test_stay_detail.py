"""UC-06 one stay's own screen, with a saved LiteAPI hotel record: no network, no key."""

import asyncio
import json
from datetime import date
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pytest

from hermes_api.errors import NotFound
from hermes_api.features.places.mock import MockPlaceProvider
from hermes_api.features.stays import live
from hermes_api.features.stays.live import LiteApiStayProvider
from hermes_api.features.stays.models import StayDates
from hermes_api.features.stays.provider import get_stay_provider

SAVED = Path(__file__).parent / "liteapi"
HOTEL = json.loads((SAVED / "hotel_blossom.json").read_text())
HOTELS = json.loads((SAVED / "hotels_kyoto.json").read_text())
RATES = json.loads((SAVED / "rates_kyoto_2_nights.json").read_text())
TWO_NIGHTS = StayDates(check_in=date(2027, 1, 12), check_out=date(2027, 1, 14))
BLOSSOM = "liteapi:lp6557b9a5"


class FakeLiteApi:
    def __init__(self, hotel=HOTEL):
        self.hotel = hotel
        self.calls = []

    async def __call__(self, method, url, headers, query, body):
        self.calls.append((method, url.rsplit("/", 1)[-1], query))
        if method == "POST":
            return 200, RATES
        if url == live.HOTEL_URL:
            return 200, self.hotel
        return 200, HOTELS


def provider(api):
    return LiteApiStayProvider("test-key", places=MockPlaceProvider(), send=api)


def run(coroutine):
    return asyncio.run(coroutine)


def test_shows_what_liteapi_knows_about_the_hotel():
    stay = run(provider(FakeLiteApi()).detail(BLOSSOM))
    assert stay.name == "THE BLOSSOM KYOTO"
    assert (stay.kind, stay.star_rating, stay.score, stay.score_word) == (
        "Hotel",
        4,
        9.3,
        "Wonderful",
    )
    assert (stay.check_in_from, stay.check_out_until) == ("3:00 PM", "11:00 AM")
    assert stay.address == "140-2 Manjujicho, Shimogyo-ku, Kyoto 600-8104"
    assert stay.phone == "+81 75-754-8735"
    assert stay.website_url is None  # LiteAPI has none for this hotel.
    assert "Free WiFi" in stay.facilities and stay.amenities == ["Wi-Fi"]
    assert stay.liked[:2] == ["Cleanliness", "Good Service"]
    assert stay.disliked == ["Inconsistent Room Maintenance", "Limited Food Quality"]
    assert stay.good_to_know == [
        "A deposit may be required at the property.",
        "Pets are not allowed.",
    ]
    distances = [float(p.distance.split()[0]) for p in stay.nearby]
    assert distances == sorted(distances)  # Nearest first.
    assert (stay.nearby[0].name, stay.nearby[0].distance) == ("Kyoto Station", "0.5 km")
    assert (stay.latitude, stay.longitude) == (34.996456, 135.762044)


def test_the_description_becomes_plain_paragraphs():
    about = run(provider(FakeLiteApi()).detail(BLOSSOM)).about
    assert about[0] == "Luxurious Accommodation in the Heart of Kyoto"
    assert about[1].startswith("Convenient Location: Situated in the center of Kyoto")
    assert not any("<" in paragraph for paragraph in about)


def test_the_main_photo_comes_first():
    stay = run(provider(FakeLiteApi()).detail(BLOSSOM))
    assert stay.main_photo == "https://static.cupid.travel/hotels/405883583.jpg"
    assert stay.photo == "https://static.cupid.travel/hotels/thumbnail/405883583.jpg"


def test_links_search_a_booking_site_and_the_map_for_this_hotel_and_dates():
    stay = run(provider(FakeLiteApi()).detail(BLOSSOM, TWO_NIGHTS))
    booking = parse_qs(urlparse(stay.booking_url).query)
    assert stay.booking_site == "Booking.com"
    assert booking["ss"] == ["THE BLOSSOM KYOTO, Kyoto"]
    assert (booking["checkin"], booking["checkout"]) == (["2027-01-12"], ["2027-01-14"])
    assert booking["group_adults"] == ["2"]
    assert "THE BLOSSOM KYOTO" in parse_qs(urlparse(stay.maps_url).query)["query"][0]


def test_without_dates_there_is_no_price_and_no_price_call():
    api = FakeLiteApi()
    stay = run(provider(api).detail(BLOSSOM))
    assert stay.nightly is None
    assert [c[0] for c in api.calls] == ["GET"]


def test_with_dates_it_is_priced_per_night():
    stay = run(provider(FakeLiteApi()).detail(BLOSSOM, TWO_NIGHTS))
    assert stay.nightly == 119.99  # 239.98 for two nights
    assert stay.free_cancellation is True


def test_opening_a_stay_from_the_list_reuses_its_price():
    api = FakeLiteApi()
    stays = provider(api)
    run(stays.list_for_place("kyoto", TWO_NIGHTS))
    run(stays.detail(BLOSSOM, TWO_NIGHTS))
    run(stays.detail(BLOSSOM, TWO_NIGHTS))
    # The list, its prices, and the hotel's record once: no second price call.
    assert [c[1] for c in api.calls] == ["hotels", "rates", "hotel"]


def test_sample_stays_open_with_what_they_have():
    stay = run(provider(FakeLiteApi()).detail("river"))
    assert stay.name and stay.booking_url and stay.about == []


@pytest.mark.parametrize("stay_id", ["liteapi:gone", "viator:1"])
def test_unknown_stays_are_not_found(stay_id):
    api = FakeLiteApi(hotel={"data": {}})
    with pytest.raises(NotFound, match="We could not find that stay."):
        run(provider(api).detail(stay_id))


def test_the_route_sends_dates_and_leaves_out_unknowns(app, client):
    app.dependency_overrides[get_stay_provider] = lambda: provider(FakeLiteApi())
    response = client.get(
        f"/stays/{BLOSSOM}", params={"checkIn": "2027-01-12", "checkOut": "2027-01-14"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["checkInFrom"] == "3:00 PM" and body["nightly"] == 119.99
    assert "websiteUrl" not in body and "near" not in body


def test_an_unknown_sample_stay_is_a_404(client):
    response = client.get("/stays/nowhere")
    assert response.status_code == 404
    assert response.json() == {"error": "We could not find that stay."}
