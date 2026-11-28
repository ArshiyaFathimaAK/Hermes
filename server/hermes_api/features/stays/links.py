"""Links out for a stay: its map, and a booking site search for the dates.

These are searches, not bookings: the app shows them as "Check availability", never as a price.
"""

from urllib.parse import urlencode

from .models import StayDates

# The app doesn't ask how many people are going yet, so searches are for two adults.
ADULTS = 2
BOOKING_SITE = "Booking.com"


def maps_url(*parts: str | None) -> str:
    """Google Maps search for the stay, e.g. its name and address."""
    query = ", ".join(p for p in parts if p)
    return "https://www.google.com/maps/search/?" + urlencode({"api": 1, "query": query})


def booking_url(name: str, where: str | None, dates: StayDates | None) -> str:
    """Booking.com search for the stay, with the dates when there are some."""
    query: dict[str, str | int] = {
        "ss": ", ".join(p for p in (name, where) if p),
        "group_adults": ADULTS,
        "no_rooms": 1,
        "group_children": 0,
    }
    if dates:
        query["checkin"] = dates.check_in.isoformat()
        query["checkout"] = dates.check_out.isoformat()
    return "https://www.booking.com/searchresults.html?" + urlencode(query)
