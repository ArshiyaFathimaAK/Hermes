"""Generate AI Itinerary. OpenAI is never called: a fake answers through httpx.MockTransport."""

import asyncio
import json

import httpx

from hermes_api.config import Settings
from hermes_api.features.activities.mock import MockActivityProvider
from hermes_api.features.itinerary import provider as provider_module
from hermes_api.features.itinerary.live import OpenAIItineraryProvider
from hermes_api.features.itinerary.models import ItineraryRequest
from hermes_api.features.itinerary.provider import RuleItineraryProvider, get_itinerary_provider

# The demo account's Lisbon trip: 5 days, three things already on the first day.
DEMO = {
    "placeIds": ["lisbon"],
    "dayCount": 5,
    "items": [
        {"activityId": "belem", "placeId": "lisbon", "schedule": {"day": 0, "slot": "morning"}},
        {"activityId": "lxf", "placeId": "lisbon", "schedule": {"day": 0, "slot": "afternoon"}},
        {"activityId": "market", "placeId": "lisbon", "schedule": {"day": 0, "slot": "evening"}},
    ],
}


def spots(plan):
    """(id, day, slot, suggested) for each entry, to compare plans in one line."""
    return [
        (e["activityId"], e["schedule"]["day"], e["schedule"]["slot"], e["suggested"])
        for e in plan["entries"]
    ]


def unscheduled(*ids, place="lisbon"):
    return [{"activityId": i, "placeId": place} for i in ids]


# The rules, through the endpoint (no key is set in tests).


def test_demo_trip_gets_one_suggestion_a_day_best_rated_first(client):
    plan = client.post("/itinerary/generate", json=DEMO).json()
    assert plan["source"] == "rules"
    assert spots(plan) == [
        ("alfama", 1, "morning", True),
        ("sintra", 2, "morning", True),
        ("miradouro", 3, "morning", True),
    ]


def test_things_with_a_day_stay_where_they_are(client):
    plan = client.post("/itinerary/generate", json=DEMO).json()
    assert {"belem", "lxf", "market"}.isdisjoint(e["activityId"] for e in plan["entries"])


def test_saved_things_are_spread_out_in_slots_that_suit_them(client):
    trip = {
        "placeIds": ["lisbon"],
        "dayCount": 3,
        "items": unscheduled("belem", "market", "alfama"),
        "addSuggestions": False,
    }
    plan = client.post("/itinerary/generate", json=trip).json()
    assert spots(plan) == [
        ("belem", 0, "morning", False),
        ("market", 1, "evening", False),
        ("alfama", 2, "morning", False),
    ]


def test_days_are_split_between_places_in_order(client):
    trip = {
        "placeIds": ["lisbon", "kyoto"],
        "dayCount": 4,
        "items": unscheduled("belem", "market") + unscheduled("tea", place="kyoto"),
    }
    plan = client.post("/itinerary/generate", json=trip).json()
    for entry in plan["entries"]:
        lisbon_day = entry["schedule"]["day"] < 2
        assert (entry["placeId"] == "lisbon") == lisbon_day, entry


def test_suggestions_only_go_on_days_with_fewer_than_two_things(client):
    trip = {"placeIds": ["kyoto"], "dayCount": 2, "items": unscheduled("tea", place="kyoto")}
    plan = client.post("/itinerary/generate", json=trip).json()
    per_day = [0, 0]
    for entry in plan["entries"]:
        per_day[entry["schedule"]["day"]] += 1
    assert per_day == [2, 2]


def test_no_suggestions_when_not_wanted(client):
    plan = client.post("/itinerary/generate", json={**DEMO, "addSuggestions": False}).json()
    assert plan["entries"] == []


def test_saved_things_that_no_longer_exist_are_left_alone(client):
    trip = {"placeIds": ["lisbon"], "dayCount": 2, "items": unscheduled("belem", "gone")}
    plan = client.post("/itinerary/generate", json=trip).json()
    assert "gone" not in [e["activityId"] for e in plan["entries"]]


def test_trips_that_cant_be_planned_get_a_message(client):
    cases = [
        ({"placeIds": ["lisbon"], "dayCount": 0}, "Pick dates for the trip first."),
        ({"placeIds": [], "dayCount": 3}, "Add a place to the trip first."),
        ({"placeIds": ["lisbon"], "dayCount": 31}, "Plans can be made for trips of up to 30 days."),
    ]
    for trip, message in cases:
        response = client.post("/itinerary/generate", json=trip)
        assert response.status_code == 400
        assert response.json() == {"error": message}


# Which provider is used.


def test_without_a_key_the_rules_plan(monkeypatch):
    monkeypatch.setattr(provider_module, "get_settings", lambda: Settings(openai_api_key=""))
    assert isinstance(get_itinerary_provider(MockActivityProvider()), RuleItineraryProvider)


def test_with_a_key_the_ai_plans(monkeypatch):
    monkeypatch.setattr(provider_module, "get_settings", lambda: Settings(openai_api_key="sk-x"))
    assert isinstance(get_itinerary_provider(MockActivityProvider()), OpenAIItineraryProvider)


# The AI, with a fake OpenAI.


def openai_answer(plan=None, *, content=None, refusal=None):
    message = {"role": "assistant", "content": content, "refusal": refusal}
    if plan is not None:
        message["content"] = json.dumps({"plan": plan})
    return {"choices": [{"index": 0, "message": message}]}


def plan_with_ai(trip, handler):
    """Runs the AI provider against `handler`, a fake OpenAI. Returns the plan and the requests."""
    sent = []

    def record(request):
        sent.append(request)
        return handler(request)

    settings = Settings(openai_api_key="sk-test", openai_model="test-model")
    ai = OpenAIItineraryProvider(MockActivityProvider(), settings, httpx.MockTransport(record))
    plan = asyncio.run(ai.generate(ItineraryRequest.model_validate(trip)))
    return plan.model_dump(by_alias=True), sent


def rules_plan(trip):
    plan = asyncio.run(
        RuleItineraryProvider(MockActivityProvider()).generate(
            ItineraryRequest.model_validate(trip)
        )
    )
    return plan.model_dump(by_alias=True)


MIXED = {
    "placeIds": ["lisbon"],
    "dayCount": 3,
    "items": [
        {"activityId": "belem", "placeId": "lisbon", "schedule": {"day": 0, "slot": "morning"}},
        *unscheduled("market", "lxf"),
    ],
}


def test_ai_plan_is_checked_and_completed():
    answer = [
        {"activityId": "market", "day": 0, "slot": "evening"},  # saved: kept
        {"activityId": "made-up", "day": 1, "slot": "morning"},  # never offered: dropped
        {"activityId": "belem", "day": 2, "slot": "morning"},  # already has a day: dropped
        {"activityId": "sintra", "day": 9, "slot": "morning"},  # no such day: dropped
        {"activityId": "alfama", "day": 1, "slot": "morning"},  # suggestion in an empty slot: kept
        {"activityId": "miradouro", "day": 0, "slot": "evening"},  # slot taken: dropped
    ]
    plan, _ = plan_with_ai(MIXED, lambda request: httpx.Response(200, json=openai_answer(answer)))
    assert plan["source"] == "ai"
    assert spots(plan) == [
        ("market", 0, "evening", False),
        ("alfama", 1, "morning", True),
        # The AI missed lxf, so the rules gave it the least busy day.
        ("lxf", 2, "morning", False),
    ]


def test_ai_is_asked_with_only_real_options_and_a_strict_schema():
    _, sent = plan_with_ai(MIXED, lambda request: httpx.Response(200, json=openai_answer([])))
    request = sent[0]
    body = json.loads(request.content)
    assert str(request.url) == "https://api.openai.com/v1/chat/completions"
    assert request.headers["Authorization"] == "Bearer sk-test"
    assert body["model"] == "test-model"
    assert body["response_format"]["json_schema"]["strict"] is True
    trip = json.loads(body["messages"][1]["content"])
    assert [t["id"] for t in trip["toPlan"]] == ["market", "lxf"]
    assert trip["alreadyPlanned"] == [{"day": 0, "slot": "morning", "name": "Belém Tower"}]
    offered = {o["id"] for o in trip["otherOptions"]}
    assert offered == {"alfama", "sintra", "miradouro"}
    assert "sk-test" not in body["messages"][1]["content"]


def test_ai_problems_fall_back_to_the_rules_and_say_so():
    def timeout(request):
        raise httpx.ReadTimeout("slow", request=request)

    problems = {
        "server error": lambda r: httpx.Response(500, json={"error": {"code": "server_error"}}),
        "wrong key": lambda r: httpx.Response(401, json={"error": {"code": "invalid_api_key"}}),
        "timeout": timeout,
        "refusal": lambda r: httpx.Response(200, json=openai_answer(refusal="I can't help")),
        "not json": lambda r: httpx.Response(200, json=openai_answer(content="Here's a plan!")),
        "nothing usable": lambda r: httpx.Response(
            200, json=openai_answer([{"activityId": "made-up", "day": 0, "slot": "morning"}])
        ),
    }
    expected = rules_plan(MIXED)
    for name, handler in problems.items():
        plan, _ = plan_with_ai(MIXED, handler)
        assert plan == expected, name
        assert plan["source"] == "rules", name


def test_ai_suggestions_are_dropped_when_not_wanted():
    trip = {**MIXED, "addSuggestions": False}
    answer = [
        {"activityId": "market", "day": 0, "slot": "evening"},
        {"activityId": "alfama", "day": 1, "slot": "morning"},
    ]
    plan, sent = plan_with_ai(trip, lambda r: httpx.Response(200, json=openai_answer(answer)))
    assert [e["suggested"] for e in plan["entries"]] == [False, False]
    assert json.loads(json.loads(sent[0].content)["messages"][1]["content"])["otherOptions"] == []
