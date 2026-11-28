"""Generate AI Itinerary with OpenAI (the Chat Completions API, with a JSON schema for the answer).

The AI only picks from the things to do it is given. rules.clean_ai_plan drops anything else and
places whatever saved thing it missed. If the AI can't be reached, is slow, or answers with nothing
usable, the plan comes from the rules and says so (source="rules"), so the app never claims an AI
plan that isn't one.

The key stays here: never send it to the app, put it in a log, or return it.
"""

import json
import logging
from typing import Any

import httpx

from ...config import Settings
from ..activities.models import Activity
from ..activities.provider import ActivityProvider
from .models import ItineraryPlan, ItineraryRequest
from .provider import load_catalog
from .rules import (
    SUGGEST_UNTIL,
    Catalog,
    Proposal,
    check_request,
    clean_ai_plan,
    is_placed,
    place_days,
    plan_with_rules,
)

log = logging.getLogger(__name__)

# Other things to do offered for each place, best rated first, to keep the request small and fast.
OPTIONS_PER_PLACE = 25

PLAN_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "plan": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "activityId": {"type": "string"},
                    "day": {"type": "integer"},
                    "slot": {"type": "string", "enum": ["morning", "afternoon", "evening"]},
                },
                "required": ["activityId", "day", "slot"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["plan"],
    "additionalProperties": False,
}

INSTRUCTIONS = f"""You plan the days of a trip for a travel app. You get the trip as JSON and \
answer with a plan.

- Days are numbered from 0 (the first day) to days - 1. Each day has three slots: morning, \
afternoon and evening.
- Put every thing in "toPlan" on exactly one day and slot. Don't list "alreadyPlanned": those stay.
- When the trip has several places, visit them in the order given, each on whole days. \
"suggestedDays" is an even split that you may adjust.
- Group things that are near each other, give long tours and day trips a day of their own, and \
pick slots that fit opening hours.
- If "suggestionsWanted" is true, you may add things from "otherOptions" to empty slots, on days \
with fewer than {SUGGEST_UNTIL} things. Pick only ones that make the day better: you don't have to \
fill every slot.
- Use only ids from "toPlan" and "otherOptions". Never make up a place or an id."""


class AiUnavailable(Exception):
    """The AI couldn't make a plan. The message goes to the server log, never to the app."""


def describe(activity: Activity) -> dict[str, Any]:
    """What the AI needs to know about a thing to do. Missing values are left out."""
    facts = {
        "id": activity.id,
        "name": activity.name,
        "category": activity.category,
        "type": activity.type,
        "duration": activity.duration,
        "hours": activity.status,
        "rating": activity.rating,
        "price": activity.price_label,
    }
    return {key: value for key, value in facts.items() if value is not None}


def describe_trip(request: ItineraryRequest, catalog: Catalog) -> dict[str, Any]:
    in_trip = {item.activity_id for item in request.items}
    already, to_plan = [], []
    for item in request.items:
        activity = catalog.by_id.get(item.activity_id)
        if activity is None:
            continue
        if item.schedule is not None and is_placed(item, request.day_count):
            already.append(
                {"day": item.schedule.day, "slot": item.schedule.slot, "name": activity.name}
            )
        else:
            to_plan.append({**describe(activity), "place": item.place_id})
    options = []
    if request.add_suggestions:
        for place_id, activities in catalog.by_place.items():
            unsaved = [a for a in activities if a.id not in in_trip]
            best = sorted(unsaved, key=lambda a: -(a.rating or 0))[:OPTIONS_PER_PLACE]
            options += [{**describe(a), "place": place_id} for a in best]
    return {
        "days": request.day_count,
        "places": [
            {"id": place_id, "suggestedDays": days}
            for place_id, days in place_days(request.place_ids, request.day_count).items()
        ],
        "alreadyPlanned": already,
        "toPlan": to_plan,
        "suggestionsWanted": request.add_suggestions,
        "otherOptions": options,
    }


def read_proposals(answer: Any) -> list[Proposal]:
    """The plan in an OpenAI answer. Lines that can't be read are skipped."""
    try:
        message = answer["choices"][0]["message"]
        if message.get("refusal"):
            raise AiUnavailable("the AI declined")
        lines = json.loads(message["content"])["plan"]
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise AiUnavailable("the AI's answer could not be read") from error
    proposals = []
    for line in lines if isinstance(lines, list) else []:
        try:
            proposals.append(
                Proposal(
                    activity_id=str(line["activityId"]), day=int(line["day"]), slot=line["slot"]
                )
            )
        except (KeyError, TypeError, ValueError):
            continue
    return proposals


class OpenAIItineraryProvider:
    def __init__(
        self,
        activities: ActivityProvider,
        settings: Settings,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self.activities = activities
        self.settings = settings
        # Tests pass a fake transport, so they never call OpenAI.
        self.transport = transport

    async def generate(self, request: ItineraryRequest) -> ItineraryPlan:
        check_request(request)
        catalog = await load_catalog(self.activities, request)
        try:
            proposals = await self.ask(request, catalog)
        except AiUnavailable as error:
            log.warning("AI itinerary unavailable, planned with the rules instead: %s", error)
            return ItineraryPlan(source="rules", entries=plan_with_rules(request, catalog))
        entries, kept = clean_ai_plan(request, catalog, proposals)
        if kept == 0:
            log.warning("The AI's plan had nothing usable, planned with the rules instead.")
            return ItineraryPlan(source="rules", entries=plan_with_rules(request, catalog))
        return ItineraryPlan(source="ai", entries=entries)

    async def ask(self, request: ItineraryRequest, catalog: Catalog) -> list[Proposal]:
        settings = self.settings
        body: dict[str, Any] = {
            "model": settings.openai_model,
            "messages": [
                {"role": "system", "content": INSTRUCTIONS},
                {"role": "user", "content": json.dumps(describe_trip(request, catalog))},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "itinerary", "strict": True, "schema": PLAN_SCHEMA},
            },
        }
        if settings.openai_reasoning_effort:
            body["reasoning_effort"] = settings.openai_reasoning_effort
        try:
            async with httpx.AsyncClient(
                timeout=settings.openai_timeout, transport=self.transport
            ) as client:
                response = await client.post(
                    f"{settings.openai_base_url.rstrip('/')}/chat/completions",
                    json=body,
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                )
                response.raise_for_status()
                answer = response.json()
        except httpx.HTTPStatusError as error:
            # The status and OpenAI's error code only: its messages can quote part of the key.
            raise AiUnavailable(
                f"OpenAI answered {error.response.status_code} ({error_code(error.response)})"
            ) from error
        except (httpx.HTTPError, ValueError) as error:
            raise AiUnavailable(f"OpenAI could not be reached ({type(error).__name__})") from error
        return read_proposals(answer)


def error_code(response: httpx.Response) -> str:
    try:
        return str(response.json()["error"]["code"])
    except (KeyError, TypeError, ValueError):
        return "no code"
