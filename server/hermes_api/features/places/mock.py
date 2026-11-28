"""Sample places, from the shared sample data. Keep this working: tests and teammates rely on it."""

from ...errors import NotFound
from ...sample_data import sample_data
from .models import Place


def sample_places() -> list[Place]:
    return [Place.model_validate(p) for p in sample_data()["places"]]


class MockPlaceProvider:
    async def search(self, query: str) -> list[Place]:
        q = query.strip().lower()
        return [p for p in sample_places() if q and p.name.lower().startswith(q)][:5]

    async def get(self, place_id: str) -> Place:
        for place in sample_places():
            if place.id == place_id:
                return place
        raise NotFound("We could not find that place.")
