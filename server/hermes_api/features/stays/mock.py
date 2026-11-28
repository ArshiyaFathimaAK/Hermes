from .models import MapPosition, Stay

STAYS = [
    Stay(
        id="river",
        place_id="lisbon",
        name="Riverside apartment, Cais do Sodré",
        kind="Apartment",
        area="Cais do Sodré",
        score=8.9,
        score_word="Excellent",
        review_count="1,240",
        near="10 min walk to 2 of your 3 saves",
        nightly=138,
        free_cancellation=True,
        amenities=["Wi-Fi", "Kitchen"],
        map_position=MapPosition(x=0.56, y=0.5),
    ),
    Stay(
        id="chiado",
        place_id="lisbon",
        name="Boutique hotel in Chiado",
        kind="Hotel",
        area="Chiado",
        score=8.6,
        score_word="Excellent",
        review_count="2,870",
        near="15 min by tram to all 3 saves",
        nightly=185,
        free_cancellation=True,
        amenities=["Wi-Fi", "Breakfast", "Pool"],
        map_position=MapPosition(x=0.8, y=0.27),
    ),
]


class MockStayProvider:
    async def list_for_place(self, place_id: str) -> list[Stay]:
        return [s for s in STAYS if s.place_id == place_id]

    async def get_many(self, stay_ids: list[str]) -> list[Stay]:
        return [s for s in STAYS if s.id in stay_ids]
