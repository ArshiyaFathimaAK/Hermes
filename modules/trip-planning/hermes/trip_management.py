"""UC-09 View Saved Trips and UC-10 Manage Trip.

Prepared with AI assistance (Claude); author review pending.

Purpose:
- UC-09: return every saved trip for the user, each with its events already resolved
  (event name, destination, and time) so the interface can show one dropdown per trip.
- UC-10: add, edit, reorder or remove a trip's events, or delete the whole trip.

Design notes:
- Service only. This file imports from the existing hermes package and changes nothing in it.
  The route lines to add to server.py are listed in the comment block at the bottom.
- Event changes reuse TripService.save_itinerary, so every existing rule still applies:
  unique item ids, a known place, a day inside the trip dates, a place in one of the trip's
  destinations, at most 200 items, and the optimistic `version` check (ConflictError -> 409).
- "Time" for an event is both its day and order within the day AND the place's schedule text
  (for example "Open daily · 10:00 AM-9:00 PM"). Itinerary items store no clock time.
- Deleting a trip removes its items, its share link (if any) and the trip in one transaction.
  The trip's share link stops working. The caller must send the trip's current `version`.
- Positions in this API are 0-based and are per day. The server renumbers them on save.
"""
import uuid
from .catalog import PLACES, ValidationError
from .details import PlaceDetailService
from .repository import ConflictError, NotFoundError
from .services import TripService

_PLACES = {p.id: p for p in PLACES}
UNAVAILABLE_NAME = 'Unavailable place'
VERSION_MESSAGE = 'Send the current trip version.'


class TripManagementService:
    def __init__(self, repository, trip_service=None, details=None):
        self.repository = repository
        self.trips = trip_service or TripService(repository)
        self.details = details or PlaceDetailService()

    # ---------------------------------------------------------------- UC-09
    def list_saved_trips(self, user_id):
        """Every saved trip for the user, newest first, each with its resolved events."""
        saved = []
        for row in self.repository.list(user_id):
            try:
                saved.append(self._present(self.repository.get(user_id, row['id'])))
            except NotFoundError:  # deleted between the list and the read
                continue
        return saved

    # ---------------------------------------------------------------- UC-10
    def add_event(self, user_id, trip_id, data):
        data = self._fields(data, allowed={'place_id', 'day', 'position', 'version'},
                            required={'place_id', 'day', 'version'})
        version = self._version(data['version'])
        position = self._position(data['position']) if 'position' in data else None
        items = self._editable(self.repository.get(user_id, trip_id))
        new = dict(id=str(uuid.uuid4()), place_id=data['place_id'], day=data['day'])
        saved = self._save(user_id, trip_id, self._insert(items, new, position), version)
        return dict(trip=saved, event_id=new['id'], message='Event added.')

    def update_event(self, user_id, trip_id, event_id, data):
        """Change an event's place, its day, or its position within the day."""
        data = self._fields(data, allowed={'place_id', 'day', 'position', 'version'}, required={'version'})
        if not data.keys() & {'place_id', 'day', 'position'}:
            raise ValidationError('Send at least one change: place_id, day or position.')
        version = self._version(data['version'])
        position = self._position(data['position']) if 'position' in data else None
        items = self._editable(self.repository.get(user_id, trip_id))
        current = self._find(items, event_id)
        old_index = [i for i in items if i['day'] == current['day']].index(current)
        updated = dict(current, place_id=data.get('place_id', current['place_id']), day=data.get('day', current['day']))
        if position is None and updated['day'] == current['day']:
            position = old_index  # same day, no new position: keep its slot
        items = [i for i in items if i is not current]
        saved = self._save(user_id, trip_id, self._insert(items, updated, position), version)
        return dict(trip=saved, event_id=event_id, message='Event updated.')

    def remove_event(self, user_id, trip_id, event_id, version):
        version = self._version(version)
        items = self._editable(self.repository.get(user_id, trip_id))
        current = self._find(items, event_id)
        saved = self._save(user_id, trip_id, [i for i in items if i is not current], version)
        return dict(trip=saved, event_id=event_id, message='Event removed.')

    def delete_trip(self, user_id, trip_id, version):
        """Delete the trip, its events and its share link in one transaction (owner only)."""
        version = self._version(version)
        with self.repository.connection() as db:
            db.execute('BEGIN IMMEDIATE')
            # _trip raises NotFoundError for a missing trip or one owned by someone else.
            trip = self.repository._trip(db, user_id, trip_id)
            if trip['version'] != version:
                raise ConflictError('This trip changed. Reload it before deleting.')
            was_shared = db.execute('SELECT 1 FROM share_links WHERE trip_id=?', (trip_id,)).fetchone() is not None
            db.execute('DELETE FROM itinerary_items WHERE trip_id=?', (trip_id,))
            db.execute('DELETE FROM share_links WHERE trip_id=?', (trip_id,))
            if db.execute('DELETE FROM trips WHERE id=? AND user_id=?', (trip_id, user_id)).rowcount != 1:
                raise NotFoundError('Trip not found.')
        message = 'Trip deleted. Its share link no longer works.' if was_shared else 'Trip deleted.'
        return dict(deleted=True, trip_id=trip_id, was_shared=was_shared, message=message)

    # -------------------------------------------------------------- helpers
    def _save(self, user_id, trip_id, items, version):
        trip = self.trips.save_itinerary(user_id, trip_id, {'items': items, 'version': version})
        return self._present(trip)

    @staticmethod
    def _editable(trip):
        """The trip's items in their saved order, in the shape save_itinerary accepts."""
        return [dict(id=i['id'], place_id=i['place_id'], day=i['day']) for i in trip['items']]

    @staticmethod
    def _find(items, event_id):
        found = next((i for i in items if isinstance(event_id, str) and i['id'] == event_id), None)
        if found is None:
            raise NotFoundError('Event not found.')
        return found

    @staticmethod
    def _insert(items, item, position):
        """Put item at `position` among its day's items (None = end of the day)."""
        group = [i for i in items if i['day'] == item['day']]
        others = [i for i in items if i['day'] != item['day']]
        group.insert(len(group) if position is None else position, item)  # list.insert clamps past the end
        return others + group

    @staticmethod
    def _position(value):
        if type(value) is not int or value < 0:
            raise ValidationError('Position must be a whole number, 0 or higher.')
        return value

    @staticmethod
    def _version(value):
        if isinstance(value, str) and value.isascii() and value.isdigit():  # DELETE sends it in the query string
            value = int(value)
        if type(value) is not int or value < 0:
            raise ValidationError(VERSION_MESSAGE)
        return value

    @staticmethod
    def _fields(data, allowed, required):
        if not isinstance(data, dict):
            raise ValidationError('Send a JSON object.')
        for field in data:
            if field not in allowed:
                raise ValidationError(f'Unsupported field: {field}.')
        for field in sorted(required):
            if field not in data:
                raise ValidationError(f'Missing required field: {field}.')
        return data

    def _schedule(self, place_id):
        try:
            return self.details.get(place_id)['schedule']
        except NotFoundError:
            return None

    def _event(self, item):
        place = _PLACES.get(item['place_id'])
        schedule = self._schedule(item['place_id']) if place else None
        order = item['position'] + 1
        label = f"{item['day']} · stop {order}" + (f' · {schedule}' if schedule else '')
        return dict(id=item['id'], place_id=item['place_id'],
                    name=place.name if place else UNAVAILABLE_NAME,
                    category=place.category if place else None,
                    destination=place.location if place else None,
                    day=item['day'], position=item['position'],
                    time=dict(day=item['day'], order=order, schedule=schedule, label=label))

    def _present(self, trip):
        events = [self._event(i) for i in trip['items']]  # already sorted by day, then position
        return dict(id=trip['id'], name=trip['name'], destinations=trip['destinations'],
                    start_date=trip['start_date'], end_date=trip['end_date'],
                    privacy=trip['privacy'], shared=trip['privacy'] == 'link',
                    version=trip['version'], event_count=len(events), events=events)


# ----------------------------------------------------------------------------
# Route lines to add to server.py (the only edit outside this file):
#
# 1) Imports and setup
#    from .trip_management import TripManagementService   # UC-09 / UC-10
#    ... inside make_server, after `trips, catalog = TripService(repo), CatalogService()`:
#    manage = TripManagementService(repo, trips)
#
# 2) Inside route(), directly after the `segments = path.strip('/').split('/')` line:
#    if self.command == 'GET' and path == '/api/trips/saved':
#        return self.send_json(200, {'trips': manage.list_saved_trips(DEMO_USER)})
#    if segments[:2] == ['api', 'trips'] and len(segments) >= 3 and segments[2].isdigit():
#        tid, query = int(segments[2]), {k: v[-1] for k, v in parse_qs(parts.query).items()}
#        if len(segments) == 4 and segments[3] == 'events' and self.command == 'POST':
#            return self.send_json(201, manage.add_event(DEMO_USER, tid, self.read_json()))
#        if len(segments) == 5 and segments[3] == 'events' and self.command == 'PUT':
#            return self.send_json(200, manage.update_event(DEMO_USER, tid, segments[4], self.read_json()))
#        if len(segments) == 5 and segments[3] == 'events' and self.command == 'DELETE':
#            return self.send_json(200, manage.remove_event(DEMO_USER, tid, segments[4], query.get('version')))
#        if len(segments) == 3 and self.command == 'DELETE':
#            return self.send_json(200, manage.delete_trip(DEMO_USER, tid, query.get('version')))
#
# 3) Next to `do_PUT = handle_request`:
#    do_DELETE = handle_request
# ----------------------------------------------------------------------------
