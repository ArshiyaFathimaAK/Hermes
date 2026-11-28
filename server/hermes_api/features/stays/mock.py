"""Sample stays, from the shared sample data. Their prices don't depend on dates."""

from ...errors import NotFound
from ...sample_data import sample_data
from .links import BOOKING_SITE, booking_url, maps_url
from .models import Stay, StayDates, StayDetail

NOT_FOUND = "We could not find that stay."


def sample_stays() -> list[Stay]:
    return [Stay.model_validate(s) for s in sample_data()["stays"]]


class MockStayProvider:
    async def list_for_place(self, place_id: str, dates: StayDates | None = None) -> list[Stay]:
        return [s for s in sample_stays() if s.place_id == place_id]

    async def get_many(self, stay_ids: list[str], dates: StayDates | None = None) -> list[Stay]:
        return [s for s in sample_stays() if s.id in stay_ids]

    async def detail(self, stay_id: str, dates: StayDates | None = None) -> StayDetail:
        """Sample stays have no photos or description: the screen shows what there is."""
        stay = next((s for s in sample_stays() if s.id == stay_id), None)
        if stay is None:
            raise NotFound(NOT_FOUND)
        return StayDetail(
            **stay.model_dump(),
            maps_url=maps_url(stay.name, stay.area),
            booking_url=booking_url(stay.name, stay.area, dates),
            booking_site=BOOKING_SITE,
        )
