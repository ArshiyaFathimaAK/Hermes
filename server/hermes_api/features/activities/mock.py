"""Sample things to do, from the design. Prices are made up."""

from urllib.parse import quote_plus

from ...errors import NotFound
from .models import Activity, ActivityDetail, NearbyActivity

ACTIVITIES = [
    Activity(
        id="belem",
        place_id="lisbon",
        category="sights",
        bookable=False,
        name="Belém Tower",
        type="Historical landmark",
        rating=4.5,
        review_count="72k",
        summary="Early 16th-century fortified tower on the riverbank, with views from the top.",
        where="Belém · 25 min by transit",
        status="Open · closes 5:30 PM",
        open_now=True,
        duration="Est. 1 hr",
        price_level=1,
        price_label="Tickets from $9",
        price_amount=9,
        amenities=["Good for kids"],
    ),
    Activity(
        id="alfama",
        place_id="lisbon",
        category="tours",
        bookable=True,
        name="Alfama Walking Tour with Tram 28 Ride",
        type="Walking tour",
        rating=4.8,
        review_count="2.1k",
        where="Meets at Martim Moniz · 12 min by transit",
        status="Daily · starts 10:00 AM",
        open_now=False,
        duration="3 hrs",
        price_level=2,
        price_label="From $28 per person",
        price_amount=28,
        amenities=["Outdoors"],
    ),
    Activity(
        id="market",
        place_id="lisbon",
        category="food",
        bookable=False,
        name="Time Out Market Lisboa",
        type="Food court",
        rating=4.4,
        review_count="60k",
        where="Cais do Sodré · 10 min by transit",
        status="Open · closes 12 AM",
        open_now=True,
        duration="Est. 1–2 hrs",
        price_level=2,
        price_label="$$ · moderate",
        price_amount=20,
    ),
    Activity(
        id="fushimi-inari",
        place_id="kyoto",
        category="sights",
        bookable=False,
        name="Fushimi Inari Taisha",
        type="Shinto shrine",
        rating=4.6,
        review_count="80k",
        where="Fushimi · 15 min by transit",
        status="Open 24 hours",
        open_now=True,
        duration="Est. 2 hrs",
        price_level=0,
        price_label="Free",
        price_amount=0,
        amenities=["Outdoors"],
    ),
]


class MockActivityProvider:
    async def list_for_place(self, place_id: str) -> list[Activity]:
        return [a for a in ACTIVITIES if a.place_id == place_id]

    async def get_many(self, activity_ids: list[str]) -> list[Activity]:
        return [a for a in ACTIVITIES if a.id in activity_ids]

    async def detail(self, activity_id: str) -> ActivityDetail:
        activity = next((a for a in ACTIVITIES if a.id == activity_id), None)
        if activity is None:
            raise NotFound("We could not find that.")
        query = quote_plus(f"{activity.name} {activity.place_id}")
        nearby = [
            NearbyActivity(id=a.id, name=a.name, meta=a.type)
            for a in ACTIVITIES
            if a.place_id == activity.place_id and a.id != activity.id
        ]
        return ActivityDetail(
            **activity.model_dump(),
            nearby=nearby,
            maps_url=f"https://www.google.com/maps/search/?api=1&query={query}",
            directions_url=f"https://www.google.com/maps/dir/?api=1&destination={query}",
        )
