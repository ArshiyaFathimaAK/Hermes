"""Matches hermes/src/domain/stay.ts.

Live stays come from LiteAPI, which doesn't know everything the sample data has. A field the
source has no value for is left empty (None) and not sent, and the app hides it.
"""

from datetime import date

from ...models import ApiModel


class MapPosition(ApiModel):
    """Fraction (0-1) of the map's width and height. Replaced by coordinates with a real map."""

    x: float
    y: float


class Stay(ApiModel):
    id: str
    name: str
    # A small photo for lists.
    photo: str | None = None
    # The place it was listed for. Unknown when a stay is looked up by id alone.
    place_id: str | None = None
    kind: str | None = None
    area: str | None = None
    # Guest score out of 10.
    score: float | None = None
    score_word: str | None = None
    review_count: str | None = None
    near: str | None = None
    # Price for one night on the dates asked for. None without dates, or when nothing is free then.
    nightly: float | None = None
    free_cancellation: bool | None = None
    amenities: list[str] = []
    map_position: MapPosition | None = None
    latitude: float | None = None
    longitude: float | None = None


class NearbyPlace(ApiModel):
    """A landmark near a stay, with how far it is ("3.2 km")."""

    name: str
    distance: str | None = None


class StayDetail(Stay):
    """Everything known about one stay, for its own screen. Missing values are left out."""

    # A large photo for the top of the screen.
    main_photo: str | None = None
    star_rating: int | None = None
    # Paragraphs of the description, as plain text.
    about: list[str] = []
    about_credit: str | None = None
    # As the hotel writes them, e.g. "3:00 PM".
    check_in_from: str | None = None
    check_out_until: str | None = None
    # What guests liked and disliked, summarized from reviews by the source.
    liked: list[str] = []
    disliked: list[str] = []
    facilities: list[str] = []
    good_to_know: list[str] = []
    address: str | None = None
    phone: str | None = None
    website_url: str | None = None
    maps_url: str | None = None
    # A search on a booking site for this stay and the dates. Not a booking.
    booking_url: str | None = None
    booking_site: str | None = None
    nearby: list[NearbyPlace] = []


class StayDates(ApiModel):
    """Check-in and check-out days. Prices depend on them."""

    check_in: date
    check_out: date

    @property
    def nights(self) -> int:
        return (self.check_out - self.check_in).days
