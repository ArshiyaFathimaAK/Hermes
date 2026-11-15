"""Trip creation and itinerary rules for Arshiya's UC-08 / UC-10 implementation."""
from datetime import date
from .catalog import LOCATIONS, PLACES, ValidationError

class TripService:
    def __init__(self, repository):
        self.repository = repository
    @staticmethod
    def parse_date(value):
        try:
            result = date.fromisoformat(value)
            if result.isoformat() != value:
                raise ValueError()
            return result
        except (ValueError, TypeError):
            raise ValidationError('Enter valid dates in YYYY-MM-DD format.')
    def create(self, user_id, data):
        if not isinstance(data, dict):
            raise ValidationError('Send a JSON object.')
        name = data.get('name')
        if not isinstance(name, str) or not name.strip():
            raise ValidationError('Enter a trip name.')
        if len(name.strip()) > 80:
            raise ValidationError('Trip name must be 80 characters or fewer.')
        destinations = data.get('destinations')
        if not isinstance(destinations, list) or not destinations:
            raise ValidationError('Select at least one destination.')
        if any(not isinstance(d, str) or d not in LOCATIONS for d in destinations):
            raise ValidationError('Choose supported destinations.')
        start, end = self.parse_date(data.get('start_date')), self.parse_date(data.get('end_date'))
        if end < start:
            raise ValidationError('End date must be on or after start date.')
        if (end - start).days > 365:
            raise ValidationError('Trips may span at most 366 days in this demo.')
        privacy = data.get('privacy', 'private')
        if privacy not in ('private', 'link'):
            raise ValidationError('Choose a valid privacy setting.')
        return self.repository.create(user_id, dict(name=name.strip(), destinations=list(dict.fromkeys(destinations)), start_date=start.isoformat(), end_date=end.isoformat(), privacy=privacy))
    def save_itinerary(self, user_id, trip_id, data):
        trip = self.repository.get(user_id, trip_id)
        if not isinstance(data, dict):
            raise ValidationError('Send a JSON object.')
        items = data.get('items')
        if not isinstance(items, list) or len(items) > 200:
            raise ValidationError('Send an itinerary list with at most 200 items.')
        version = data.get('version')
        if type(version) is not int or version < 0:
            raise ValidationError('Send the current itinerary version.')
        known_places = {p.id: p for p in PLACES}
        normalized, seen, counts = [], set(), {}
        for item in items:
            if not isinstance(item, dict):
                raise ValidationError('Each itinerary item must be an object.')
            uid, pid, day = item.get('id'), item.get('place_id'), item.get('day')
            if not isinstance(uid, str) or not 1 <= len(uid) <= 80 or uid in seen:
                raise ValidationError('Every itinerary item needs a unique ID.')
            if type(pid) is not int or pid not in known_places:
                raise ValidationError('Choose an available destination or lodging.')
            self.parse_date(day)
            if not trip['start_date'] <= day <= trip['end_date']:
                raise ValidationError('Choose an itinerary day within the trip dates.')
            if known_places[pid].location not in trip['destinations']:
                raise ValidationError('Choose a place in one of this trip\'s destinations.')
            seen.add(uid)
            position = counts.get(day, 0)
            counts[day] = position + 1
            normalized.append(dict(id=uid, place_id=pid, day=day, position=position))
        return self.repository.replace_items(user_id, trip_id, normalized, version)
