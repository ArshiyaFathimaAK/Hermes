def test_lists_things_to_do_in_camel_case(client):
    belem = client.get("/places/lisbon/activities").json()[0]
    assert belem["placeId"] == "lisbon"
    assert belem["reviewCount"] == "72k"
    assert belem["openNow"] is True
    assert "place_id" not in belem


def test_get_many_leaves_out_unknown_ids(client):
    response = client.get("/activities", params={"ids": "belem,gone,market"})
    assert [a["id"] for a in response.json()] == ["belem", "market"]


def test_detail_includes_links(client):
    detail = client.get("/activities/belem").json()
    assert detail["mapsUrl"].startswith("https://www.google.com/maps/")
    assert [n["id"] for n in detail["nearby"]] == ["alfama", "market"]


def test_unknown_activity_is_a_404(client):
    assert client.get("/activities/nope").status_code == 404
