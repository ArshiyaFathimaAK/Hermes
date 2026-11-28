from datetime import date, timedelta


def test_current_weather(client):
    assert client.get("/places/lisbon/weather/current").json() == {
        "temperature": 64,
        "condition": "sunny",
    }


def test_one_entry_per_day_including_both_ends(client):
    start = date.today()
    params = {"start": start.isoformat(), "end": (start + timedelta(days=4)).isoformat()}
    days = client.get("/places/lisbon/weather/daily", params=params).json()
    assert len(days) == 5
    assert days[0]["date"] == start.isoformat()
    assert days[0]["isTypical"] is False


def test_far_off_days_are_marked_typical(client):
    start = date.today() + timedelta(days=30)
    params = {"start": start.isoformat(), "end": start.isoformat()}
    assert client.get("/places/lisbon/weather/daily", params=params).json()[0]["isTypical"]


def test_backwards_range_is_rejected(client):
    response = client.get(
        "/places/lisbon/weather/daily", params={"start": "2026-12-05", "end": "2026-12-01"}
    )
    assert response.status_code == 400
    assert response.json() == {"error": "The last day can't be before the first."}


def test_bad_dates_explain_themselves(client):
    response = client.get(
        "/places/lisbon/weather/daily", params={"start": "soon", "end": "2026-12-01"}
    )
    assert response.status_code == 422
    assert response.json()["error"].startswith("start:")
