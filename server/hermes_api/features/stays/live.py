"""UC-06 lodging on LiteAPI (https://docs.liteapi.travel): hotels near a place, priced for dates.

A sandbox key (sand_...) returns real hotels with test prices. Calls are kept down like place
search (hermes_api/request_cache.py):

- Hotels near a place are kept for HOTELS_SECONDS; prices, which change, for PRICES_SECONDS.
- A place lists at most MAX_STAYS hotels, and prices for all of them come in one call.
- Identical requests share one call, and at most CALLS_PER_MINUTE go out.

Only what LiteAPI says is used. A hotel with no rating has no score, and "near" (walking time to
saves) isn't known here, so it's left out. With dates, hotels without a free room are left out.

One stay's own screen (`detail`) asks for its full record once a day, and reuses the price the list
already fetched for the same dates.
"""

import html
import logging
import re
import time
from collections.abc import Awaitable, Callable
from typing import Any

import httpx

from ...config import get_settings
from ...errors import NotFound, UpstreamUnavailable
from ...ids import make_id, split_id
from ...request_cache import CachedCalls, CallLimit, Clock, TtlCache
from ..places.provider import PlaceProvider
from .links import ADULTS, BOOKING_SITE, booking_url, maps_url
from .mock import NOT_FOUND, MockStayProvider
from .models import MapPosition, NearbyPlace, Stay, StayDates, StayDetail

logger = logging.getLogger(__name__)

HOTELS_URL = "https://api.liteapi.travel/v3.0/data/hotels"
RATES_URL = "https://api.liteapi.travel/v3.0/hotels/rates"
HOTEL_URL = "https://api.liteapi.travel/v3.0/data/hotel"

RADIUS_METERS = 5000
MAX_STAYS = 20
CURRENCY = "USD"
HOTELS_SECONDS = 24 * 60 * 60
PRICES_SECONDS = 30 * 60
CACHE_SIZE = 1000
CALLS_PER_MINUTE = 30
MAX_NEARBY = 5

BUSY = "Stay search is busy right now. Try again in a minute."
DOWN = "Stay search is not responding. Try again soon."

# LiteAPI hotel types (GET /data/hotelTypes) grouped into the app's three kinds. Others are hidden.
KINDS = {
    "Hotel": {204, 205, 206, 219, 225, 226, 231, 233},
    "Apartment": {201, 207, 213, 220, 229, 250},
    "Guesthouse": {203, 208, 209, 216, 218, 222, 227, 247, 251},
}
# LiteAPI facility ids (GET /data/facilities) for the amenities the app filters on.
AMENITIES = {
    "Wi-Fi": {47, 107, 164, 775},
    "Breakfast": {24, 43, 519, 529, 729, 730, 731, 732, 733, 756, 780, 923, 924, 925, 926, 987,
                  1054, 12112},
    "Kitchen": {141},
    "Pool": {103, 104, 120, 193, 194, 195, 196, 197, 301, 781, 830, 832, 835, 837},
}  # fmt: skip
# Words for a score out of 10, as booking sites use them.
SCORE_WORDS = [(9, "Wonderful"), (8, "Very good"), (7, "Good"), (6, "Pleasant")]

# (method, url, headers, query, json body) -> (status code, decoded JSON body)
Send = Callable[[str, str, dict[str, str], dict[str, Any] | None, Any], Awaitable[tuple[int, Any]]]


async def send_with_httpx(
    method: str, url: str, headers: dict[str, str], query: dict[str, Any] | None, body: Any
) -> tuple[int, Any]:
    try:
        # Prices can take a while: LiteAPI asks several suppliers.
        timeout = max(get_settings().outbound_timeout, 20)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(method, url, headers=headers, params=query, json=body)
            return response.status_code, response.json()
    except (httpx.HTTPError, ValueError) as error:
        raise UpstreamUnavailable(DOWN) from error


def kind_for(type_id: Any) -> str | None:
    return next((kind for kind, ids in KINDS.items() if type_id in ids), None)


def score_word(score: float | None) -> str | None:
    return next((word for floor, word in SCORE_WORDS if score is not None and score >= floor), None)


def stay_from_hotel(hotel: dict[str, Any], place_id: str | None) -> Stay:
    rating = hotel.get("rating")
    score = float(rating) if isinstance(rating, int | float) and rating > 0 else None
    reviews = hotel.get("reviewCount")
    facilities = set(hotel.get("facilityIds") or [])
    return Stay(
        # Thumbnails are ~25 KB, full photos ~600 KB: lists of 20 stay quick.
        photo=web_address(hotel.get("thumbnail")) or web_address(hotel.get("main_photo")),
        id=make_id("liteapi", hotel["id"]),
        name=hotel["name"],
        place_id=place_id,
        kind=kind_for(hotel.get("hotelTypeId")),
        score=score,
        score_word=score_word(score),
        review_count=f"{reviews:,}" if isinstance(reviews, int) and reviews > 0 else None,
        amenities=[name for name, ids in AMENITIES.items() if facilities & ids],
        latitude=hotel.get("latitude"),
        longitude=hotel.get("longitude"),
    )


def with_map_positions(stays: list[Stay]) -> list[Stay]:
    """Spread pins over the placeholder map by their real positions, north at the top."""
    located = [s for s in stays if s.latitude is not None and s.longitude is not None]
    if not located:
        return stays
    lats = [s.latitude for s in located]
    lngs = [s.longitude for s in located]

    def fraction(value: float, low: float, high: float) -> float:
        return 0.5 if high == low else 0.1 + 0.8 * (value - low) / (high - low)

    for stay in located:
        stay.map_position = MapPosition(
            x=round(fraction(stay.longitude, min(lngs), max(lngs)), 3),
            y=round(1 - fraction(stay.latitude, min(lats), max(lats)), 3),
        )
    return stays


def paragraphs(text: str | None) -> list[str]:
    """HTML or plain text to paragraphs of plain text."""
    parts = re.split(r"</p>|<br\s*/?>|\n\s*\n", text or "", flags=re.IGNORECASE)
    cleaned = (" ".join(html.unescape(re.sub(r"<[^>]+>", " ", p)).split()) for p in parts)
    return [p.replace(" :", ":") for p in cleaned if p]


def clock_time(value: Any) -> str | None:
    """ "03:00 PM" -> "3:00 PM"."""
    if not isinstance(value, str) or not value.strip():
        return None
    return re.sub(r"^0(\d)", r"\1", value.strip())


def web_address(value: Any) -> str | None:
    return value if isinstance(value, str) and value.startswith("https://") else None


def photo_urls(images: Any) -> list[str]:
    ordered = sorted(
        (i for i in images or [] if isinstance(i, dict) and (i.get("urlHd") or i.get("url"))),
        key=lambda i: (not i.get("defaultImage"), i.get("order") or 0),
    )
    return [i.get("urlHd") or i["url"] for i in ordered]


def nearest_first(pois: Any) -> list[dict[str, Any]]:
    """Landmarks with a name, nearest first; ones without a distance go last."""
    named = [p for p in pois or [] if isinstance(p, dict) and p.get("name")]

    def distance(poi: dict[str, Any]) -> float:
        km = poi.get("distanceKm")
        return km if isinstance(km, int | float) else float("inf")

    return sorted(named, key=distance)


def detail_from_hotel(hotel: dict[str, Any], dates: StayDates | None) -> StayDetail:
    """LiteAPI's full record of one hotel (GET /data/hotel) for its own screen."""
    location = hotel.get("location") or {}
    stay = stay_from_hotel(
        {
            **hotel,
            "facilityIds": [f.get("facilityId") for f in hotel.get("facilities") or []],
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
        },
        None,
    )
    times = hotel.get("checkinCheckoutTimes") or {}
    sentiment = hotel.get("sentiment_analysis") or {}
    photos = photo_urls(hotel.get("hotelImages"))
    stars = hotel.get("starRating")
    city = hotel.get("city") or None
    town = " ".join(p for p in (city, hotel.get("zip")) if p) or None
    address = ", ".join(p for p in (hotel.get("address"), town) if p) or None
    facilities = list(dict.fromkeys(f for f in hotel.get("hotelFacilities") or [] if f))
    good_to_know = paragraphs(hotel.get("hotelImportantInformation"))
    if hotel.get("petsAllowed") is True:
        good_to_know.append("Pets are allowed.")
    elif hotel.get("petsAllowed") is False:
        good_to_know.append("Pets are not allowed.")
    nearby = [
        NearbyPlace(
            name=poi["name"],
            distance=f"{poi['distanceKm']:g} km"
            if isinstance(poi.get("distanceKm"), int | float)
            else None,
        )
        for poi in nearest_first(hotel.get("poi"))[:MAX_NEARBY]
    ]
    website = hotel.get("website")
    phone = hotel.get("phone")
    return StayDetail(
        **stay.model_dump(),
        main_photo=(photos[0] if photos else None) or web_address(hotel.get("main_photo")),
        star_rating=stars if isinstance(stars, int) and stars > 0 else None,
        about=paragraphs(hotel.get("hotelDescription")),
        about_credit="Description from LiteAPI",
        check_in_from=clock_time(times.get("checkin_start")),
        check_out_until=clock_time(times.get("checkout")),
        liked=[p for p in sentiment.get("pros") or [] if isinstance(p, str)],
        disliked=[c for c in sentiment.get("cons") or [] if isinstance(c, str)],
        facilities=facilities,
        good_to_know=good_to_know,
        address=address,
        phone=phone if isinstance(phone, str) and phone.strip() else None,
        website_url=website if isinstance(website, str) and website.startswith("http") else None,
        maps_url=maps_url(stay.name, address),
        booking_url=booking_url(stay.name, city, dates),
        booking_site=BOOKING_SITE,
        nearby=nearby,
    )


def prices_from_rates(data: Any, nights: int) -> dict[str, tuple[float, bool]]:
    """Hotel id -> (cheapest price for one night, whether that offer can be cancelled for free)."""
    prices: dict[str, tuple[float, bool]] = {}
    for hotel in data.get("data") or []:
        best: tuple[float, bool] | None = None
        for room in hotel.get("roomTypes") or []:
            offer = room.get("offerRetailRate") or {}
            amount = offer.get("amount")
            if not isinstance(amount, int | float) or offer.get("currency") != CURRENCY:
                continue
            rates = room.get("rates") or [{}]
            refundable = (rates[0].get("cancellationPolicies") or {}).get("refundableTag") == "RFN"
            if best is None or amount < best[0]:
                best = (amount, refundable)
        if best is not None:
            prices[hotel["hotelId"]] = (round(best[0] / nights, 2), best[1])
    return prices


class LiteApiStayProvider:
    def __init__(
        self,
        api_key: str,
        *,
        places: PlaceProvider,
        send: Send = send_with_httpx,
        clock: Clock = time.monotonic,
    ):
        self._api_key = api_key
        self._places = places
        self._send = send
        self._calls = CachedCalls(TtlCache(HOTELS_SECONDS, CACHE_SIZE, clock))
        self._limit = CallLimit(CALLS_PER_MINUTE, service="LiteAPI", busy=BUSY, clock=clock)
        # Stays saved before lodging went live (sample ids) still show.
        self._samples = MockStayProvider()

    async def list_for_place(self, place_id: str, dates: StayDates | None = None) -> list[Stay]:
        place = await self._places.get(place_id)  # NotFound passes on
        if place.latitude is None or place.longitude is None:
            return []
        query = {
            "latitude": place.latitude,
            "longitude": place.longitude,
            "radius": RADIUS_METERS,
            "limit": MAX_STAYS,
        }
        hotels = await self._calls.once(
            f"near:{place.latitude},{place.longitude}", lambda: self._hotels(query)
        )
        for hotel in hotels:
            self._calls.cache.put(f"hotel:{hotel['id']}", hotel)
        stays = [stay_from_hotel(hotel, place_id) for hotel in hotels]
        if dates:
            stays = [s for s in await self._priced(stays, dates) if s.nightly is not None]
        return with_map_positions(stays)

    async def get_many(self, stay_ids: list[str], dates: StayDates | None = None) -> list[Stay]:
        samples = [i for i in stay_ids if split_id(i)[0] == "sample"]
        wanted = [split_id(i)[1] for i in stay_ids if split_id(i)[0] == "liteapi"]
        hotels = {h: self._calls.cache.get(f"hotel:{h}") for h in wanted}
        missing = sorted(h for h, hotel in hotels.items() if hotel is None)
        if missing:
            query = {"hotelIds": ",".join(missing)}
            for hotel in await self._calls.once(
                f"ids:{query['hotelIds']}", lambda: self._hotels(query)
            ):
                self._calls.cache.put(f"hotel:{hotel['id']}", hotel)
                hotels[hotel["id"]] = hotel
        stays = [stay_from_hotel(hotels[h], None) for h in wanted if hotels.get(h)]
        if dates:
            stays = await self._priced(stays, dates)  # No room then: shown without a price.
        return await self._samples.get_many(samples) + stays

    async def detail(self, stay_id: str, dates: StayDates | None = None) -> StayDetail:
        source, hotel_id = split_id(stay_id)
        if source == "sample":
            return await self._samples.detail(stay_id, dates)
        if source != "liteapi" or not hotel_id:
            raise NotFound(NOT_FOUND)

        async def fetch() -> dict[str, Any]:
            data = await self._call("GET", HOTEL_URL, {"hotelId": hotel_id}, None)
            hotel = data.get("data")
            if not isinstance(hotel, dict) or not hotel.get("name") or hotel.get("deletedAt"):
                raise NotFound(NOT_FOUND)
            return hotel

        detail = detail_from_hotel(await self._calls.once(f"detail:{hotel_id}", fetch), dates)
        if dates:
            await self._priced([detail], dates)
        return detail

    async def _hotels(self, query: dict[str, Any]) -> list[dict[str, Any]]:
        data = await self._call("GET", HOTELS_URL, query, None)
        return [
            h
            for h in data.get("data") or []
            if h.get("id") and h.get("name") and not h.get("deletedAt")
        ]

    async def _priced(self, stays: list[Stay], dates: StayDates) -> list[Stay]:
        if not stays:
            return stays
        ids = sorted(split_id(s.id)[1] for s in stays)
        body = {
            "hotelIds": ids,
            "checkin": dates.check_in.isoformat(),
            "checkout": dates.check_out.isoformat(),
            "occupancies": [{"adults": ADULTS}],
            "currency": CURRENCY,
            "guestNationality": "US",
            "maxRatesPerHotel": 1,
        }

        async def fetch() -> dict[str, tuple[float, bool]]:
            data = await self._call("POST", RATES_URL, None, body, no_rooms_is_empty=True)
            return prices_from_rates(data, dates.nights)

        # Each hotel's price is also kept on its own, so opening one stay from the list
        # doesn't ask again. () means "no room then".
        def own(hotel_id: str) -> str:
            return f"price:{hotel_id}:{body['checkin']}:{body['checkout']}"

        known = {i: self._calls.cache.get(own(i)) for i in ids}
        if all(price is not None for price in known.values()):
            prices = {i: price for i, price in known.items() if price}
        else:
            key = f"prices:{body['checkin']}:{body['checkout']}:{','.join(ids)}"
            prices = await self._calls.once(key, fetch, seconds=PRICES_SECONDS)
            for i in ids:
                self._calls.cache.put(own(i), prices.get(i, ()), PRICES_SECONDS)
        for stay in stays:
            price = prices.get(split_id(stay.id)[1])
            if price:
                stay.nightly, stay.free_cancellation = price
        return stays

    async def _call(
        self, method: str, url: str, query: Any, body: Any, *, no_rooms_is_empty: bool = False
    ) -> Any:
        self._limit.take()
        headers = {"X-API-Key": self._api_key, "accept": "application/json"}
        status, data = await self._send(method, url, headers, query, body)
        if status == 200:
            return data if isinstance(data, dict) else {}
        error = data.get("error", {}) if isinstance(data, dict) else {}
        code = error.get("code") if isinstance(error, dict) else None
        # LiteAPI answers "no availability" (code 2001) as an error. For prices, that's no rooms.
        if no_rooms_is_empty and code == 2001:
            return {}
        if status == 429:
            logger.warning("LiteAPI: rate limit reached.")
            raise UpstreamUnavailable(BUSY)
        # Wrong key, plan limits... Say why in the server log, never the key.
        logger.warning("LiteAPI answered %s (code %s).", status, code)
        raise UpstreamUnavailable(DOWN)
