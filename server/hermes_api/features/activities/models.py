"""Matches hermes/src/domain/activity.ts. Optional fields are hidden in the app when missing:
leave them out rather than inventing a value."""

from typing import Literal

from ...models import ApiModel

ActivityCategory = Literal["sights", "food", "tours"]


class Activity(ApiModel):
    id: str
    place_id: str
    category: ActivityCategory
    bookable: bool
    name: str
    type: str
    rating: float | None = None
    review_count: str | None = None
    # The app's mock uses bundled images; live data sends a URL.
    image_url: str | None = None
    photo_credit: str | None = None
    summary: str | None = None
    where: str
    status: str
    open_now: bool
    duration: str | None = None
    price_level: Literal[0, 1, 2, 3, 4] | None = None
    price_label: str | None = None
    price_amount: float | None = None
    amenities: list[str] = []


class NearbyActivity(ApiModel):
    id: str
    name: str
    meta: str


class ActivityDetail(Activity):
    photo_count: int | None = None
    hours: str | None = None
    about: str | None = None
    about_credit: str | None = None
    address: str | None = None
    travel: str | None = None
    nearby: list[NearbyActivity] = []
    website_url: str | None = None
    maps_url: str
    directions_url: str
