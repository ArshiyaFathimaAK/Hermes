"""Asking paid or rate-limited services as little as possible.

Live providers keep one `CachedCalls` for the life of the server: answers are kept for a while,
identical requests that arrive together share one call, and calls stop at a per-minute limit so a
bug or a busy hour can't use up a key's quota. Used by places and stays.
"""

import asyncio
import logging
import time
from collections import OrderedDict, deque
from collections.abc import Awaitable, Callable
from typing import Any

from .errors import UpstreamUnavailable

logger = logging.getLogger(__name__)

Clock = Callable[[], float]


class TtlCache:
    """A small in-memory cache: entries expire, and the oldest go first when it's full."""

    def __init__(self, seconds: float, size: int, clock: Clock = time.monotonic):
        self._seconds, self._size, self._clock = seconds, size, clock
        self._entries: OrderedDict[str, tuple[float, Any]] = OrderedDict()

    def get(self, key: str) -> Any | None:
        entry = self._entries.get(key)
        if entry is None or entry[0] < self._clock():
            self._entries.pop(key, None)
            return None
        self._entries.move_to_end(key)
        return entry[1]

    def put(self, key: str, value: Any, seconds: float | None = None) -> None:
        expires = self._clock() + (self._seconds if seconds is None else seconds)
        self._entries[key] = (expires, value)
        self._entries.move_to_end(key)
        while len(self._entries) > self._size:
            self._entries.popitem(last=False)


class CallLimit:
    """Allows `per_minute` calls in any 60 seconds; past that, raises `busy` for people to read."""

    def __init__(self, per_minute: int, *, service: str, busy: str, clock: Clock = time.monotonic):
        self._per_minute, self._service, self._busy, self._clock = per_minute, service, busy, clock
        self._calls: deque[float] = deque()

    def take(self) -> None:
        now = self._clock()
        while self._calls and self._calls[0] <= now - 60:
            self._calls.popleft()
        if len(self._calls) >= self._per_minute:
            logger.warning(
                "%s: over %s calls a minute, refusing more.", self._service, self._per_minute
            )
            raise UpstreamUnavailable(self._busy)
        self._calls.append(now)


class CachedCalls:
    """A cache plus sharing: `await once(key, fetch)` calls `fetch` only when nobody has lately."""

    def __init__(self, cache: TtlCache):
        self.cache = cache
        self._pending: dict[str, asyncio.Future[Any]] = {}

    async def once(
        self, key: str, fetch: Callable[[], Awaitable[Any]], seconds: float | None = None
    ) -> Any:
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        if key in self._pending:
            return await asyncio.shield(self._pending[key])
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self._pending[key] = future
        try:
            value = await fetch()
            self.cache.put(key, value, seconds)
            future.set_result(value)
            return value
        except Exception as error:
            future.set_exception(error)
            future.exception()  # Mark as seen when nobody else was waiting.
            raise
        finally:
            del self._pending[key]
