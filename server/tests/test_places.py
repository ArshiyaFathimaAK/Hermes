from hermes_api.features.places.models import Place
from hermes_api.features.places.provider import get_place_provider


def test_search_matches_the_start_of_names(client):
    response = client.get("/places/search", params={"q": "li"})
    assert response.status_code == 200
    assert [p["id"] for p in response.json()] == ["lisbon", "lille", "lima"]


def test_empty_search_returns_nothing(client):
    assert client.get("/places/search").json() == []


def test_unknown_place_is_a_404_with_a_message(client):
    response = client.get("/places/atlantis")
    assert response.status_code == 404
    assert response.json() == {"error": "We could not find that place."}


def test_a_provider_can_be_swapped_in_tests(app, client):
    """The pattern for testing a live provider's route without calling the real service."""

    class OnePlace:
        async def search(self, query):
            return [Place(id="x", name="X", region="Y")]

        async def get(self, place_id):
            return Place(id="x", name="X", region="Y")

    app.dependency_overrides[get_place_provider] = OnePlace
    assert client.get("/places/search", params={"q": "a"}).json() == [
        {"id": "x", "name": "X", "region": "Y", "latitude": None, "longitude": None}
    ]
