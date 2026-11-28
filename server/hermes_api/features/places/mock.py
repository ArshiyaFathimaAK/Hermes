"""Sample places. Keep this working: tests and teammates rely on it."""

from ...errors import NotFound
from .models import Place

PLACES = [
    Place(id="lisbon", name="Lisbon", region="Portugal", latitude=38.72, longitude=-9.14),
    Place(id="lille", name="Lille", region="France", latitude=50.63, longitude=3.06),
    Place(id="lima", name="Lima", region="Peru", latitude=-12.05, longitude=-77.04),
    Place(id="kyoto", name="Kyoto", region="Japan", latitude=35.01, longitude=135.77),
    Place(id="denver", name="Denver", region="Colorado, USA", latitude=39.74, longitude=-104.99),
]


class MockPlaceProvider:
    async def search(self, query: str) -> list[Place]:
        q = query.strip().lower()
        return [p for p in PLACES if q and p.name.lower().startswith(q)][:5]

    async def get(self, place_id: str) -> Place:
        for place in PLACES:
            if place.id == place_id:
                return place
        raise NotFound("We could not find that place.")
