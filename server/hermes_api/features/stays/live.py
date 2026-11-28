"""UC-06 lodging on LiteAPI (https://docs.liteapi.travel): hotels near a place, priced for dates.

A sandbox key (sand_...) returns real hotels with test prices. Calls are kept down like place
search (hermes_api/request_cache.py):

- Hotels near a place are kept for HOTELS_SECONDS; prices, which change, for PRICES_SECONDS.
- A place lists at most MAX_STAYS hotels, and prices for all of them come in one call.
- Identical requests share one call, and at most CALLS_PER_MINUTE go out.

Only what LiteAPI says is used. A hotel with no rating has no score, and "near" (walking time to
saves) isn't known here, so it's left out. With dates, hotels without a free room are left out.
"""

import logging
import time
from collections.abc import Awaitable, Callable
from typing import Any

import httpx

from ...config import get_settings
from ...errors import UpstreamUnavailable
from ...ids import make_id, split_id
from ...request_cache import CachedCalls, CallLimit, Clock, TtlCache
from ..places.provider import PlaceProvider
from .mock import MockStayProvider
from .models import MapPosition, Stay, StayDates

logger = logging.getLogger(__name__)

HOTELS_URL = "https://api.liteapi.travel/v3.0/data/hotels"
RATES_URL = "https://api.liteapi.travel/v3.0/hotels/rates"

RADIUS_METERS = 5000
MAX_STAYS = 20
# The app doesn't ask how many people are going yet, so prices are for two adults.
ADULTS = 2
CURRENCY = "USD"
HOTELS_SECONDS = 24 * 60 * 60
PRICES_SECONDS = 30 * 60
CACHE_SIZE = 1000
CALLS_PER_MINUTE = 30

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

        key = f"prices:{body['checkin']}:{body['checkout']}:{','.join(ids)}"
        prices = await self._calls.once(key, fetch, seconds=PRICES_SECONDS)
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
