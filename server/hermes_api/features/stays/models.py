"""Matches hermes/src/domain/stay.ts."""

from ...models import ApiModel


class MapPosition(ApiModel):
    """Fraction (0-1) of the map's width and height. Replaced by coordinates with a real map."""

    x: float
    y: float


class Stay(ApiModel):
    id: str
    place_id: str
    name: str
    kind: str
    area: str
    score: float
    score_word: str
    review_count: str
    near: str
    nightly: float
    free_cancellation: bool
    amenities: list[str] = []
    map_position: MapPosition
