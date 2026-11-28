"""UC-11 View Estimated Trip Cost (FR-27).
Spenser Saunders, Assignment 4. Drafted with AI assistance (Claude), reviewed and tested.

Cost rule used by this demo:
- The estimate is the sum of the catalog price of every stop in the SAVED itinerary.
- A lodging placed on a day counts as one night, so a hotel added to three days is three nights.
- Free places count as $0.
- Unsaved edits in the browser are not included until the itinerary is saved.
- A stop whose place has no price data is left out of the total and counted in `unpriced_items`
  (FR-27 says "using available itinerary cost data").
"""
from datetime import date, timedelta
from .catalog import PLACES

EMPTY_MESSAGE = 'Add stops to your itinerary to see an estimated cost.'
READY_MESSAGE = 'Estimated total based on your saved itinerary.'


def trip_days(start, end):
    """Every date from start to end, inclusive, as YYYY-MM-DD strings."""
    day, last = date.fromisoformat(start), date.fromisoformat(end)
    days = []
    while day <= last:
        days.append(day.isoformat())
        day += timedelta(days=1)
    return days


class CostService:
    """Builds the cost estimate for one of the user's saved trips."""

    def __init__(self, repository):
        self.repository = repository

    def estimate(self, user_id, trip_id):
        # repository.get raises NotFoundError for a missing trip or one owned by someone else (NFR-04).
        trip = self.repository.get(user_id, trip_id)
        places = {p.id: p for p in PLACES}
        by_day = {day: dict(day=day, subtotal=0, stops=0) for day in trip_days(trip['start_date'], trip['end_date'])}
        lines, lodging_total, lodging_nights, activities_total, unpriced = [], 0, 0, 0, 0
        for item in trip['items']:  # already sorted by day, then position
            place = places.get(item['place_id'])
            if place is None:
                unpriced += 1
                continue
            day = by_day.setdefault(item['day'], dict(day=item['day'], subtotal=0, stops=0))
            day['subtotal'] += place.price
            day['stops'] += 1
            if place.category == 'lodging':
                lodging_total += place.price
                lodging_nights += 1
            else:
                activities_total += place.price
            lines.append(dict(day=item['day'], position=item['position'], place_id=place.id,
                              name=place.name, category=place.category, price=place.price))
        return dict(
            trip_id=trip['id'], trip_name=trip['name'], currency='USD',
            total=lodging_total + activities_total,
            lodging_total=lodging_total, lodging_nights=lodging_nights, activities_total=activities_total,
            by_day=sorted(by_day.values(), key=lambda d: d['day']), lines=lines,
            item_count=len(lines), unpriced_items=unpriced, based_on_version=trip['version'],
            message=READY_MESSAGE if trip['items'] else EMPTY_MESSAGE,
        )
