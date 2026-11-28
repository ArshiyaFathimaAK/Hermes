"""UC-04 Search for Destination.

To go live: write a class with these methods in live.py, then change `get_place_provider`.
"""

from typing import Protocol

from .models import Place


class PlaceProvider(Protocol):
    async def search(self, query: str) -> list[Place]:
        """Up to 5 places matching the query. An empty query returns nothing."""
        ...

    async def get(self, place_id: str) -> Place:
        """Raises NotFound for an unknown id."""
        ...


def get_place_provider() -> PlaceProvider:
    from .mock import MockPlaceProvider

    return MockPlaceProvider()
