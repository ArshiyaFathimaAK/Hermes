"""The shared sample data must fit the models, so the app and the server read it the same way."""

from hermes_api.features.activities.mock import sample_activities
from hermes_api.features.activities.models import NearbyActivity
from hermes_api.features.places.mock import sample_places
from hermes_api.features.stays.mock import sample_stays
from hermes_api.features.weather.models import CurrentWeather
from hermes_api.sample_data import sample_data


def test_every_entry_fits_its_model():
    assert len(sample_places()) == len(sample_data()["places"])
    assert len(sample_activities()) == len(sample_data()["activities"])
    assert len(sample_stays()) == len(sample_data()["stays"])
    for place_weather in sample_data()["weather"].values():
        if isinstance(place_weather, dict):
            CurrentWeather.model_validate(place_weather["current"])


def test_ids_are_unique():
    for kind in ("places", "activities", "stays"):
        ids = [item["id"] for item in sample_data()[kind]]
        assert len(ids) == len(set(ids)), kind


def test_everything_points_at_something_that_exists():
    places = {p.id for p in sample_places()}
    activities = {a.id for a in sample_activities()}
    assert {a.place_id for a in sample_activities()} <= places
    assert {s.place_id for s in sample_stays()} <= places
    for activity_id, extra in sample_data()["activityDetails"].items():
        assert activity_id in activities
        for nearby in extra.get("nearby", []):
            assert NearbyActivity.model_validate(nearby).id in activities
