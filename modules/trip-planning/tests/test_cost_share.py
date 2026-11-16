"""Tests for UC-11 View Estimated Trip Cost (FR-27) and UC-12 Share Trip (FR-28, FR-29).
Spenser Saunders, Assignment 4. Drafted with AI assistance (Claude), reviewed and run.

Test design (Ch13.1 / Ch13.2):
- UC-11 equivalence classes on the saved itinerary: empty, only free places, priced places,
  lodging on several days, plus boundaries (one-day trip) and the owner condition.
- UC-12 decision table: requester is owner (Y/N) x link already exists (Y/N) for creating;
  token well-formed and known / well-formed and unknown / malformed for viewing.
Run from modules/trip-planning:  python -m unittest tests.test_cost_share -v
"""
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from hermes.api import make_server, DEMO_USER
from hermes.cost import CostService, EMPTY_MESSAGE, READY_MESSAGE
from hermes.repository import TripRepository, NotFoundError
from hermes.services import TripService
from hermes.sharing import ShareService, INVALID_LINK

OWNER = 'spenser'
AUSTIN = dict(name='Austin weekend', destinations=['Austin'], start_date='2026-11-20', end_date='2026-11-22', privacy='private')


class CostAndShareTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = TripRepository(Path(self.temp.name) / 'test.db')
        self.trips = TripService(self.repo)
        self.costs = CostService(self.repo)
        self.sharing = ShareService(self.repo)

    def tearDown(self):
        self.temp.cleanup()

    def new_trip(self, user=OWNER, **changes):
        return self.trips.create(user, {**AUSTIN, **changes})

    def save(self, trip, stops, user=OWNER):
        """stops = [(place_id, day), ...]; returns the saved trip."""
        items = [dict(id=f'i{n}', place_id=pid, day=day) for n, (pid, day) in enumerate(stops)]
        current = self.repo.get(user, trip['id'])
        return self.trips.save_itinerary(user, trip['id'], dict(version=current['version'], items=items))

    # ---------- UC-11 View Estimated Trip Cost (FR-27) ----------
    def test_TC_UC11_01_empty_itinerary(self):
        estimate = self.costs.estimate(OWNER, self.new_trip()['id'])
        self.assertEqual(estimate['total'], 0)
        self.assertEqual(estimate['item_count'], 0)
        self.assertEqual(estimate['message'], EMPTY_MESSAGE)
        self.assertEqual([d['day'] for d in estimate['by_day']], ['2026-11-20', '2026-11-21', '2026-11-22'])

    def test_TC_UC11_02_only_free_places(self):
        trip = self.new_trip()
        self.save(trip, [(3, '2026-11-20')])  # Walk Lady Bird Lake, $0
        estimate = self.costs.estimate(OWNER, trip['id'])
        self.assertEqual((estimate['total'], estimate['item_count']), (0, 1))
        self.assertEqual(estimate['message'], READY_MESSAGE)

    def test_TC_UC11_03_lodging_nights_and_activities(self):
        trip = self.new_trip()
        # Lakeside House $145 on two days + South Congress $28 = 145 + 145 + 28 = 318
        self.save(trip, [(1, '2026-11-20'), (4, '2026-11-20'), (1, '2026-11-21')])
        e = self.costs.estimate(OWNER, trip['id'])
        self.assertEqual(e['total'], 318)
        self.assertEqual((e['lodging_total'], e['lodging_nights'], e['activities_total']), (290, 2, 28))
        self.assertEqual([(d['day'], d['subtotal'], d['stops']) for d in e['by_day']],
                         [('2026-11-20', 173, 2), ('2026-11-21', 145, 1), ('2026-11-22', 0, 0)])

    def test_TC_UC11_04_single_day_trip_boundary(self):
        trip = self.new_trip(end_date='2026-11-20')
        self.save(trip, [(2, '2026-11-20')])  # The Congress Stay $169
        e = self.costs.estimate(OWNER, trip['id'])
        self.assertEqual(len(e['by_day']), 1)
        self.assertEqual((e['total'], e['lodging_nights']), (169, 1))

    def test_TC_UC11_05_other_users_trip_is_hidden(self):
        trip = self.new_trip()
        with self.assertRaisesRegex(NotFoundError, 'Trip not found.'):
            self.costs.estimate('someone-else', trip['id'])

    def test_TC_UC11_06_estimate_follows_saved_itinerary(self):
        trip = self.new_trip()
        self.save(trip, [(1, '2026-11-20'), (4, '2026-11-21')])
        self.assertEqual(self.costs.estimate(OWNER, trip['id'])['total'], 173)
        self.save(trip, [(4, '2026-11-21')])  # lodging removed and saved
        e = self.costs.estimate(OWNER, trip['id'])
        self.assertEqual((e['total'], e['lodging_nights'], e['based_on_version']), (28, 0, 2))

    # ---------- UC-12 Share Trip (FR-28, FR-29) ----------
    def test_TC_UC12_01_owner_creates_link(self):
        trip = self.new_trip()
        link = self.sharing.create_link(OWNER, trip['id'])
        self.assertRegex(link['token'], r'^[A-Za-z0-9_-]{22}$')
        self.assertEqual(link['path'], '/?share=' + link['token'])
        self.assertEqual(link['message'], 'Share link ready. Anyone with this link can view this trip.')
        self.assertEqual(self.repo.get(OWNER, trip['id'])['privacy'], 'link')

    def test_TC_UC12_02_second_request_reuses_link(self):
        trip = self.new_trip()
        first = self.sharing.create_link(OWNER, trip['id'])['token']
        self.assertEqual(self.sharing.create_link(OWNER, trip['id'])['token'], first)

    def test_TC_UC12_03_non_owner_cannot_create_link(self):
        trip = self.new_trip()
        with self.assertRaisesRegex(NotFoundError, 'Trip not found.'):
            self.sharing.create_link('someone-else', trip['id'])
        self.assertEqual(self.repo.get(OWNER, trip['id'])['privacy'], 'private')
        with self.repo.connection() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM share_links').fetchone()[0], 0)

    def test_TC_UC12_04_valid_link_shows_read_only_trip(self):
        trip = self.new_trip()
        self.save(trip, [(1, '2026-11-20'), (4, '2026-11-20')])
        view = self.sharing.view(self.sharing.create_link(OWNER, trip['id'])['token'])
        self.assertEqual(view['name'], 'Austin weekend')
        self.assertEqual([s['name'] for s in view['stops']], ['Lakeside House', 'South Congress'])
        self.assertTrue(view['read_only'])
        self.assertEqual(set(view), {'name', 'destinations', 'start_date', 'end_date', 'stops', 'read_only'})

    def test_TC_UC12_05_link_exposes_no_other_trip(self):
        shared = self.new_trip(name='Shared Austin')
        self.new_trip(name='Private Dallas', destinations=['Dallas'])
        token = self.sharing.create_link(OWNER, shared['id'])['token']
        text = json.dumps(self.sharing.view(token))
        self.assertIn('Shared Austin', text)
        self.assertNotIn('Private Dallas', text)
        self.assertNotIn(OWNER, text)  # owner ID never leaves the server

    def test_TC_UC12_06_unknown_link(self):
        with self.assertRaisesRegex(NotFoundError, INVALID_LINK):
            self.sharing.view('A' * 22)

    def test_TC_UC12_07_malformed_links(self):
        for token in ('', 'abc', "' OR 1=1 --", 'A' * 65, None):
            with self.subTest(token=token), self.assertRaisesRegex(NotFoundError, INVALID_LINK):
                self.sharing.view(token)

    def test_TC_UC12_08_link_shows_latest_saved_itinerary(self):
        trip = self.new_trip()
        token = self.sharing.create_link(OWNER, trip['id'])['token']
        self.assertEqual(self.sharing.view(token)['stops'], [])
        self.save(trip, [(3, '2026-11-21')])
        self.assertEqual([s['name'] for s in self.sharing.view(token)['stops']], ['Walk Lady Bird Lake'])


class CostAndShareAPITests(unittest.TestCase):
    """The same features over real HTTP, through api.py's routes and error mapping."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.server = make_server(Path(self.temp.name) / 'api.db', 0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join(); self.temp.cleanup()

    def request(self, path, method='GET', body=None):
        req = Request(self.base + path, method=method, data=None if body is None else json.dumps(body).encode(),
                      headers={'Content-Type': 'application/json'})
        try:
            response = urlopen(req)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.load(response)

    def test_TC_UC11_07_api_cost_and_missing_trip(self):
        _, created = self.request('/api/trips', 'POST', AUSTIN)
        trip_id = created['trip']['id']
        self.request(f'/api/trips/{trip_id}/itinerary', 'PUT', dict(version=0, items=[dict(id='a', place_id=1, day='2026-11-20')]))
        status, body = self.request(f'/api/trips/{trip_id}/cost')
        self.assertEqual((status, body['estimate']['total']), (200, 145))
        status, body = self.request('/api/trips/999/cost')
        self.assertEqual((status, body['error']), (404, 'Trip not found.'))

    def test_TC_UC12_09_api_share_and_view(self):
        _, created = self.request('/api/trips', 'POST', AUSTIN)
        status, link = self.request(f"/api/trips/{created['trip']['id']}/share", 'POST')
        self.assertEqual(status, 200)
        status, body = self.request('/api/shared/' + link['token'])
        self.assertEqual((status, body['trip']['name']), (200, 'Austin weekend'))
        self.assertNotIn(DEMO_USER, json.dumps(body))
        for bad in ('/api/shared/not-a-real-token-xyz', '/api/shared/'):
            with self.subTest(path=bad):
                status, body = self.request(bad)
                self.assertEqual((status, body['error']), (404, INVALID_LINK))


if __name__ == '__main__':
    unittest.main(verbosity=2)
