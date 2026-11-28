"""UC-04 on Google Places API (New): autocomplete for search, Place Details for one place.

Google charges per request and the key has a daily limit, so this provider asks as little as it can:

- Searches under MIN_QUERY_LENGTH characters never leave the server.
- Answers are kept in memory (CACHE_SECONDS), so the same search or place is asked for once.
- Identical requests that arrive together share one call to Google.
- At most CALLS_PER_MINUTE calls go out. Past that people see "busy", and the quota is spared.
- Place Details asks only for Essentials fields (no displayName), the cheapest kind.

The app debounces typing too (hermes/src/features/explore/use-explore.ts).
"""

import asyncio
import logging
import time
from collections import OrderedDict, deque
from collections.abc import Awaitable, Callable
from typing import Any

import httpx

from ...config import get_settings
from ...errors import NotFound, UpstreamUnavailable
from ...ids import make_id, split_id
from .mock import MockPlaceProvider
from .models import Place

logger = logging.getLogger(__name__)

AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete"
DETAILS_URL = "https://places.googleapis.com/v1/places/{place_id}"
# Essentials fields only. Asking for displayName would bill every lookup at a higher rate.
DETAILS_FIELDS = "id,formattedAddress,addressComponents,location"

MIN_QUERY_LENGTH = 2
MAX_RESULTS = 5
CACHE_SECONDS = 6 * 60 * 60
CACHE_SIZE = 2000
CALLS_PER_MINUTE = 60

NOT_FOUND = "We could not find that place."
BUSY = "Place search is busy right now. Try again in a minute."
DOWN = "Place search is not responding. Try again soon."

# (method, url, headers, json body) -> (status code, decoded JSON body)
Send = Callable[[str, str, dict[str, str], Any], Awaitable[tuple[int, Any]]]


async def send_with_httpx(
    method: str, url: str, headers: dict[str, str], body: Any
) -> tuple[int, Any]:
    try:
        async with httpx.AsyncClient(timeout=get_settings().outbound_timeout) as client:
            response = await client.request(method, url, headers=headers, json=body)
            return response.status_code, response.json()
    except (httpx.HTTPError, ValueError) as error:
        raise UpstreamUnavailable(DOWN) from error


class TtlCache:
    """A small in-memory cache: entries expire, and the oldest go first when it's full."""

    def __init__(self, seconds: float, size: int, clock: Callable[[], float]):
        self._seconds, self._size, self._clock = seconds, size, clock
        self._entries: OrderedDict[str, tuple[float, Any]] = OrderedDict()

    def get(self, key: str) -> Any | None:
        entry = self._entries.get(key)
        if entry is None or entry[0] < self._clock():
            self._entries.pop(key, None)
            return None
        self._entries.move_to_end(key)
        return entry[1]

    def put(self, key: str, value: Any) -> None:
        self._entries[key] = (self._clock() + self._seconds, value)
        self._entries.move_to_end(key)
        while len(self._entries) > self._size:
            self._entries.popitem(last=False)


class CallLimit:
    """Allows `per_minute` calls in any 60 seconds, so a bug or a busy hour can't burn the quota."""

    def __init__(self, per_minute: int, clock: Callable[[], float]):
        self._per_minute, self._clock = per_minute, clock
        self._calls: deque[float] = deque()

    def take(self) -> None:
        now = self._clock()
        while self._calls and self._calls[0] <= now - 60:
            self._calls.popleft()
        if len(self._calls) >= self._per_minute:
            logger.warning(
                "Google Places: over %s calls a minute, refusing more.", self._per_minute
            )
            raise UpstreamUnavailable(BUSY)
        self._calls.append(now)


def normalize(query: str) -> str:
    return " ".join(query.lower().split())


def places_from_autocomplete(data: Any) -> list[Place]:
    places = []
    for suggestion in data.get("suggestions", []):
        prediction = suggestion.get("placePrediction")
        if not prediction or "postal_code" in prediction.get("types", []):
            continue
        text = prediction.get("structuredFormat", {})
        name = text.get("mainText", {}).get("text")
        if not name:
            continue
        places.append(
            Place(
                id=make_id("google", prediction["placeId"]),
                name=name,
                region=text.get("secondaryText", {}).get("text", ""),
            )
        )
    return places[:MAX_RESULTS]


def place_from_details(data: Any) -> Place:
    """Name from the first address part ("Lisbon"), region from the rest ("Portugal")."""
    address = data.get("formattedAddress", "")
    components = data.get("addressComponents") or []
    name = components[0].get("longText") if components else None
    first, _, rest = address.partition(", ")
    name = name or first
    if not name:
        raise NotFound(NOT_FOUND)
    location = data.get("location") or {}
    return Place(
        id=make_id("google", data["id"]),
        name=name,
        region=rest if first == name or not rest else address,
        latitude=location.get("latitude"),
        longitude=location.get("longitude"),
    )


class GooglePlaceProvider:
    def __init__(
        self,
        api_key: str,
        *,
        send: Send = send_with_httpx,
        clock: Callable[[], float] = time.monotonic,
    ):
        self._api_key = api_key
        self._send = send
        self._cache = TtlCache(CACHE_SECONDS, CACHE_SIZE, clock)
        self._limit = CallLimit(CALLS_PER_MINUTE, clock)
        self._pending: dict[str, asyncio.Future[Any]] = {}
        # Places saved before search went live (sample ids) still open.
        self._samples = MockPlaceProvider()

    async def search(self, query: str) -> list[Place]:
        q = normalize(query)
        if len(q) < MIN_QUERY_LENGTH:
            return []
        body = {"input": q, "includedPrimaryTypes": ["(regions)"]}
        return await self._once(
            f"search:{q}",
            lambda: self._call("POST", AUTOCOMPLETE_URL, body, places_from_autocomplete),
        )

    async def get(self, place_id: str) -> Place:
        source, google_id = split_id(place_id)
        if source == "sample":
            return await self._samples.get(place_id)
        if source != "google" or "/" in google_id:
            raise NotFound(NOT_FOUND)
        url = DETAILS_URL.format(place_id=google_id)
        return await self._once(
            f"place:{google_id}",
            lambda: self._call("GET", url, None, place_from_details, fields=DETAILS_FIELDS),
        )

    async def _once(self, key: str, fetch: Callable[[], Awaitable[Any]]) -> Any:
        """The cached answer, or one shared call for everyone asking the same thing right now."""
        cached = self._cache.get(key)
        if cached is not None:
            return cached
        if key in self._pending:
            return await asyncio.shield(self._pending[key])
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self._pending[key] = future
        try:
            value = await fetch()
            self._cache.put(key, value)
            future.set_result(value)
            return value
        except Exception as error:
            future.set_exception(error)
            future.exception()  # Mark as seen when nobody else was waiting.
            raise
        finally:
            del self._pending[key]

    async def _call(self, method: str, url: str, body: Any, parse, *, fields: str | None = None):
        self._limit.take()
        headers = {"X-Goog-Api-Key": self._api_key}
        if fields:
            headers["X-Goog-FieldMask"] = fields
        status, data = await self._send(method, url, headers, body)
        if status == 200:
            return parse(data)
        reason = data.get("error", {}).get("status") if isinstance(data, dict) else None
        if status in (400, 404) and method == "GET":
            raise NotFound(NOT_FOUND)
        if status == 429 or reason == "RESOURCE_EXHAUSTED":
            logger.warning("Google Places: quota or rate limit reached.")
            raise UpstreamUnavailable(BUSY)
        # Wrong key, API not turned on, billing off... Say why in the server log, never the key.
        logger.warning("Google Places answered %s %s.", status, reason or "")
        raise UpstreamUnavailable(DOWN)
