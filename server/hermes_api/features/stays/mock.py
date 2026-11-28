"""Sample stays, from the shared sample data."""

from ...sample_data import sample_data
from .models import Stay


def sample_stays() -> list[Stay]:
    return [Stay.model_validate(s) for s in sample_data()["stays"]]


class MockStayProvider:
    async def list_for_place(self, place_id: str) -> list[Stay]:
        return [s for s in sample_stays() if s.place_id == place_id]

    async def get_many(self, stay_ids: list[str]) -> list[Stay]:
        return [s for s in sample_stays() if s.id in stay_ids]
