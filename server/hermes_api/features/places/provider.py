"""UC-04 Search for Destination.

Live search uses Google Places when GOOGLE_PLACES_API_KEY is set in .env, and the sample data
otherwise, so everyone can run the server without the key.
"""

import logging
from functools import lru_cache
from typing import Protocol

from ...config import get_settings
from .models import Place

logger = logging.getLogger(__name__)


class PlaceProvider(Protocol):
    async def search(self, query: str) -> list[Place]:
        """Up to 5 places matching the query. An empty query returns nothing."""
        ...

    async def get(self, place_id: str) -> Place:
        """Raises NotFound for an unknown id."""
        ...


@lru_cache
def get_place_provider() -> PlaceProvider:
    """One provider for the whole server, so every request shares its cache and call limit."""
    api_key = get_settings().google_places_api_key
    if api_key:
        from .live import GooglePlaceProvider

        return GooglePlaceProvider(api_key)

    from .mock import MockPlaceProvider

    logger.warning(
        "GOOGLE_PLACES_API_KEY is not set in server/.env: place search uses sample data."
    )
    return MockPlaceProvider()
