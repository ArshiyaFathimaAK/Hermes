"""Domain value objects for UC-05, UC-08 and UC-10. Prepared for Arshiya with AI assistance."""
from dataclasses import dataclass

@dataclass(frozen=True)
class Place:
    id: int
    name: str
    location: str
    category: str
    price: int
    rating: float
    amenities: tuple[str, ...] = ()

@dataclass
class Trip:
    id: int
    user_id: str
    name: str
    destinations: list[str]
    start_date: str
    end_date: str
    privacy: str
    version: int

@dataclass
class ItineraryItem:
    id: str
    trip_id: int
    place_id: int
    day: str
    position: int
