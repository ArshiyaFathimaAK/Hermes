"""UC-06 View Lodging.

Live stays come from LiteAPI when LITEAPI_API_KEY is set in .env, and the sample data otherwise,
so everyone can run the server without the key.
"""

import logging
from functools import lru_cache
from typing import Protocol

from ...config import get_settings
from .models import Stay, StayDates

logger = logging.getLogger(__name__)


class StayProvider(Protocol):
    async def list_for_place(self, place_id: str, dates: StayDates | None = None) -> list[Stay]:
        """Stays near the place. With dates, only ones with a room then, priced for those dates."""
        ...

    async def get_many(self, stay_ids: list[str], dates: StayDates | None = None) -> list[Stay]:
        """Unknown ids are left out, not an error. With dates, priced for those dates."""
        ...


@lru_cache
def get_stay_provider() -> StayProvider:
    """One provider for the whole server, so every request shares its cache and call limit."""
    api_key = get_settings().liteapi_api_key
    if api_key:
        from ..places.provider import get_place_provider
        from .live import LiteApiStayProvider

        return LiteApiStayProvider(api_key, places=get_place_provider())

    from .mock import MockStayProvider

    logger.warning("LITEAPI_API_KEY is not set in server/.env: stays use sample data.")
    return MockStayProvider()
