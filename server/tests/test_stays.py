def test_lists_stays_for_a_place(client):
    stays = client.get("/places/lisbon/stays").json()
    assert [s["id"] for s in stays] == ["river", "belem-house", "chiado"]
    assert stays[0]["mapPosition"] == {"x": 0.56, "y": 0.5}


def test_place_without_stays_is_an_empty_list(client):
    assert client.get("/places/denver/stays").json() == []
