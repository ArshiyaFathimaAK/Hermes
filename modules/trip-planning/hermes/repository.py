"""SQLite data access and atomic writes. Replace this adapter for team Supabase integration."""
from dataclasses import asdict
import json
import sqlite3
from contextlib import contextmanager
from .models import Trip, ItineraryItem

class NotFoundError(ValueError):
    pass

class ConflictError(ValueError):
    pass

class TripRepository:
    def __init__(self, db_path):
        self.db_path = str(db_path)
        with self.connection() as db:
            db.executescript('''
            CREATE TABLE IF NOT EXISTS trips (
              id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
              destinations TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
              privacy TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0,
              CHECK(start_date <= end_date));
            CREATE TABLE IF NOT EXISTS itinerary_items (
              id TEXT PRIMARY KEY, trip_id INTEGER NOT NULL REFERENCES trips(id),
              place_id INTEGER NOT NULL, day TEXT NOT NULL, position INTEGER NOT NULL,
              UNIQUE(trip_id, day, position));
            ''')
    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.db_path, timeout=5)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys = ON')
        try:
            with db:
                yield db
        finally:
            db.close()
    def create(self, user_id, data):
        with self.connection() as db:
            cursor = db.execute('INSERT INTO trips(user_id,name,destinations,start_date,end_date,privacy) VALUES(?,?,?,?,?,?)',
                (user_id, data['name'], json.dumps(data['destinations']), data['start_date'], data['end_date'], data['privacy']))
            trip_id = cursor.lastrowid
        return self.get(user_id, trip_id)
    def _trip(self, db, user_id, trip_id):
        row = db.execute('SELECT * FROM trips WHERE id=? AND user_id=?', (trip_id, user_id)).fetchone()
        if row is None:
            raise NotFoundError('Trip not found.')
        trip = dict(row)
        trip['destinations'] = json.loads(trip['destinations'])
        trip = asdict(Trip(**trip))
        trip['items'] = [asdict(ItineraryItem(**dict(x))) for x in db.execute('SELECT id,trip_id,place_id,day,position FROM itinerary_items WHERE trip_id=? ORDER BY day,position', (trip_id,))]
        return trip
    def get(self, user_id, trip_id):
        with self.connection() as db:
            return self._trip(db, user_id, trip_id)
    def list(self, user_id):
        with self.connection() as db:
            return [dict(x) for x in db.execute('SELECT id,name,start_date,end_date FROM trips WHERE user_id=? ORDER BY id DESC', (user_id,))]
    def replace_items(self, user_id, trip_id, items, expected_version):
        with self.connection() as db:
            db.execute('BEGIN IMMEDIATE')
            self._trip(db, user_id, trip_id)
            changed = db.execute('UPDATE trips SET version=version+1 WHERE id=? AND user_id=? AND version=?', (trip_id, user_id, expected_version)).rowcount
            if changed != 1:
                raise ConflictError('This itinerary changed. Reload the trip before saving again.')
            db.execute('DELETE FROM itinerary_items WHERE trip_id=?', (trip_id,))
            for item in items:
                db.execute('INSERT INTO itinerary_items(id,trip_id,place_id,day,position) VALUES(?,?,?,?,?)',
                    (item['id'], trip_id, item['place_id'], item['day'], item['position']))
            # Any insert failure rolls back both deletion and version change.
        return self.get(user_id, trip_id)
