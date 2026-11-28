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


class StayDates(ApiModel):
    """Check-in and check-out days. Prices depend on them."""

    check_in: date
    check_out: date

    @property
    def nights(self) -> int:
        return (self.check_out - self.check_in).days
