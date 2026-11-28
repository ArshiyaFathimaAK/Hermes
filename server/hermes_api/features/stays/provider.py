"""UC-06 View Lodging.

To go live: write a class with these methods in live.py, then change `get_stay_provider`.
"""

from typing import Protocol

from .models import Stay


class StayProvider(Protocol):
    async def list_for_place(self, place_id: str) -> list[Stay]: ...

    async def get_many(self, stay_ids: list[str]) -> list[Stay]:
        """Unknown ids are left out, not an error."""
        ...


def get_stay_provider() -> StayProvider:
    from .mock import MockStayProvider

    return MockStayProvider()
