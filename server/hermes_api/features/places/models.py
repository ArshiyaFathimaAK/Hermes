"""Matches hermes/src/domain/place.ts."""

from ...models import ApiModel


class Place(ApiModel):
    id: str
    name: str
    region: str
    # Not used by the app yet; live providers need them for weather and distances.
    latitude: float | None = None
    longitude: float | None = None
