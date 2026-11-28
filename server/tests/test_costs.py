def test_adds_activities_and_stays_for_every_night(client):
    response = client.post(
        "/costs/estimate",
        json={"activityIds": ["belem", "market"], "stayIds": ["river"], "nights": 4},
    )
    assert response.json() == {"lodging": 552, "activities": 29, "total": 581, "unpriced": 0}


def test_counts_things_without_a_price(client):
    estimate = client.post(
        "/costs/estimate", json={"activityIds": ["belem", "fushimi-inari"], "nights": 0}
    ).json()
    assert estimate["unpriced"] == 0
    assert estimate["activities"] == 9


def test_empty_trip_costs_nothing(client):
    assert client.post("/costs/estimate", json={}).json()["total"] == 0
