"""Sample stays, from the shared sample data. Their prices don't depend on dates."""

from ...sample_data import sample_data
from .models import Stay, StayDates


def sample_stays() -> list[Stay]:
    return [Stay.model_validate(s) for s in sample_data()["stays"]]


class MockStayProvider:
    async def list_for_place(self, place_id: str, dates: StayDates | None = None) -> list[Stay]:
        return [s for s in sample_stays() if s.place_id == place_id]

    async def get_many(self, stay_ids: list[str], dates: StayDates | None = None) -> list[Stay]:
        return [s for s in sample_stays() if s.id in stay_ids]
