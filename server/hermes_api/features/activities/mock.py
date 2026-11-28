"""Sample things to do, from the shared sample data. Prices are made up."""

from urllib.parse import quote

from ...errors import NotFound
from ...sample_data import sample_data
from .models import Activity, ActivityDetail


def sample_activities() -> list[Activity]:
    return [Activity.model_validate(a) for a in sample_data()["activities"]]


class MockActivityProvider:
    async def list_for_place(self, place_id: str) -> list[Activity]:
        return [a for a in sample_activities() if a.place_id == place_id]

    async def get_many(self, activity_ids: list[str]) -> list[Activity]:
        return [a for a in sample_activities() if a.id in activity_ids]

    async def detail(self, activity_id: str) -> ActivityDetail:
        activity = next((a for a in sample_activities() if a.id == activity_id), None)
        if activity is None:
            raise NotFound("We could not find that.")
        query = quote(f"{activity.name} {activity.place_id}")
        extra = sample_data()["activityDetails"].get(activity_id, {})
        return ActivityDetail.model_validate(
            {
                **activity.model_dump(by_alias=True),
                "mapsUrl": f"https://www.google.com/maps/search/?api=1&query={query}",
                "directionsUrl": f"https://www.google.com/maps/dir/?api=1&destination={query}",
                **extra,
            }
        )
