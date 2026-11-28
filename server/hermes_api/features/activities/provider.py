"""UC-06 View Destination: things to do. Filtering (UC-05) happens in the app.

To go live: write a class with these methods in live.py, then change `get_activity_provider`.
"""

from typing import Protocol

from .models import Activity, ActivityDetail


class ActivityProvider(Protocol):
    async def list_for_place(self, place_id: str) -> list[Activity]: ...

    async def get_many(self, activity_ids: list[str]) -> list[Activity]:
        """Unknown ids are left out, not an error: saved things can disappear."""
        ...

    async def detail(self, activity_id: str) -> ActivityDetail:
        """Raises NotFound for an unknown id."""
        ...


def get_activity_provider() -> ActivityProvider:
    from .mock import MockActivityProvider

    return MockActivityProvider()
