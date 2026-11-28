"""UC-03 Manage User Profile and UC-04 Search for Destination tests.

Author: Sharad Rangaraju (AI-assisted draft; author review pending).
Purpose: check concrete profile, search and HTTP outcomes using isolated SQLite
databases. These are assistant-run checks, not evidence of a personal student run.
"""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
from time import perf_counter
import unittest
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from hermes.api import DEMO_USER, make_server
from hermes.catalog import ValidationError
from hermes.profile import ProfileRepository, ProfileService
from hermes.repository import ConflictError, TripRepository
from hermes.search import SearchService

VALID = dict(display_name='Sharad Rangaraju', email='sharad@example.com', phone='972-555-0100', address='', version=0)


class ProfileSearchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'test.db'
        self.repo = ProfileRepository(self.path)
        self.service = ProfileService(self.repo)
        self.search = SearchService()

    def tearDown(self):
        self.temp.cleanup()

    def assert_invalid(self, data, message):
        with self.assertRaises(ValidationError) as error:
            self.service.save(DEMO_USER, data)
        self.assertEqual(str(error.exception), message)
        self.assertEqual(self.repo.get(DEMO_USER)['version'], 0)

    def test_SR_TC01_profile_persists_and_trims(self):
        self.service.save(DEMO_USER, {**VALID, 'display_name': ' Sharad Rangaraju ',
                          'email': ' sharad@example.com ', 'phone': ' 972-555-0100 ', 'address': ' Sample address '})
        self.assertEqual(ProfileRepository(self.path).get(DEMO_USER),
                         {**VALID, 'user_id': DEMO_USER, 'address': 'Sample address', 'version': 1})

    def test_SR_TC02_austin_lodging_ranked(self):
        self.assertEqual([p['id'] for p in self.search.search('  AuStIn lodging  ')], [1, 2])

    def test_SR_TC03_invalid_emails(self):
        for email in ('sharad', 'a@b', '', 'a@@b.com', 'a@b..com', 'a b@example.com', None, 12):
            with self.subTest(email=email):
                self.assert_invalid({**VALID, 'email': email}, 'Enter a valid email address.')

    def test_SR_TC04_invalid_names(self):
        for name in (' ', 'a' * 61, None, 12):
            with self.subTest(name=name):
                self.assert_invalid({**VALID, 'display_name': name}, 'Enter your name (1-60 characters).')

    def test_SR_TC05_unsupported_field(self):
        self.assert_invalid({**VALID, 'role': 'admin'}, 'Unsupported profile field: role.')

    def test_SR_TC07_description_only_match(self):
        self.assertEqual(self.search.search('rooftop'), [dict(id=2, name='The Congress Stay', location='Austin',
                         category='lodging', rating=4.6, price=169,
                         snippet='Boutique hotel near downtown with a rooftop pool and breakfast bar.')])

    def test_SR_TC11_phone_and_address_boundaries(self):
        for phone in ('123456', '1' * 21, '972.555.0100', None, 9725550100):
            with self.subTest(phone=phone):
                self.assert_invalid({**VALID, 'phone': phone}, 'Enter a valid phone number.')
        for address in ('x' * 121, None, []):
            with self.subTest(address=address):
                self.assert_invalid({**VALID, 'address': address}, 'Address must be 120 characters or fewer.')
        for version, phone in enumerate(('1234567', '+1 (972) 555-0100', '1' * 20, ''), start=0):
            saved = self.service.save(DEMO_USER, {**VALID, 'display_name': ' N' + 'a' * 59 + ' ',
                                      'phone': phone, 'address': ' ' + 'x' * 120 + ' ', 'version': version})
            self.assertEqual((saved['phone'], saved['address'], saved['version']), (phone, 'x' * 120, version + 1))
            self.assertEqual(len(saved['display_name']), 60)

    def test_SR_TC12_invalid_bodies_and_versions(self):
        for data in ([], None, 'profile'):
            with self.subTest(data=data):
                self.assert_invalid(data, 'Send a JSON object.')
        for version in (None, True, -1, '0', 0.0):
            with self.subTest(version=version):
                self.assert_invalid({**VALID, 'version': version}, 'Send the current profile version.')
        self.assert_invalid({k: v for k, v in VALID.items() if k != 'version'}, 'Send the current profile version.')

    def test_SR_TC13_empty_profile_and_user_isolation(self):
        self.assertEqual(self.repo.get(DEMO_USER), dict(user_id=DEMO_USER, display_name='', email='', phone='', address='', version=0))
        self.service.save(DEMO_USER, VALID)
        self.assertEqual(self.repo.get('other-user'), dict(user_id='other-user', display_name='', email='', phone='', address='', version=0))
        saved = self.service.save('other-user', dict(display_name='Other', email='other@example.com', version=0))
        self.assertEqual((saved['phone'], saved['address'], saved['version']), ('', '', 1))
        self.assertEqual(self.repo.get(DEMO_USER)['email'], 'sharad@example.com')

    def test_SR_TC14_search_weights_and_all_words(self):
        # Description adds one point to Arts District Walk; the other name matches tie
        # on score, so Walk Lady Bird Lake (4.9) precedes River Walk (4.8).
        self.assertEqual([p['id'] for p in self.search.search('walk')], [5, 3, 7, 1])
        self.assertEqual([p['id'] for p in self.search.search('Austin rooftop lodging')], [2])
        self.assertEqual(self.search.search('Dallas rooftop'), [])
        self.assertEqual(self.search.search('x' * 80), [])
        self.assertEqual(self.search.search("' OR 1=1 --"), [])

    def test_SR_TC15_concurrent_first_save_and_stale_update(self):
        barrier = threading.Barrier(2)
        def save():
            barrier.wait()
            try:
                return self.service.save(DEMO_USER, VALID)['version']
            except ConflictError as error:
                return str(error)
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: save(), range(2)))
        self.assertCountEqual(results, [1, 'Your profile changed. Reload before saving again.'])
        saved = self.service.save(DEMO_USER, {**VALID, 'display_name': 'Updated', 'version': 1})
        with self.assertRaises(ConflictError) as error:
            self.service.save(DEMO_USER, {**VALID, 'display_name': 'Stale', 'version': 1})
        self.assertEqual(str(error.exception), 'Your profile changed. Reload before saving again.')
        self.assertEqual(self.repo.get(DEMO_USER), saved)
        self.assertEqual(saved['version'], 2)

    def test_SR_TC16_failed_update_rolls_back_and_trip_tables_coexist(self):
        trips = TripRepository(self.path)
        saved = self.service.save(DEMO_USER, VALID)
        with self.repo.connection() as db:
            db.execute("CREATE TRIGGER force_fail BEFORE UPDATE ON profiles BEGIN SELECT RAISE(ABORT, 'injected failure'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            self.service.save(DEMO_USER, {**VALID, 'display_name': 'Changed', 'version': 1})
        self.assertEqual(self.repo.get(DEMO_USER), saved)
        self.assertEqual(trips.list(DEMO_USER), [])

    def test_SR_NF01_one_hundred_searches(self):
        start = perf_counter()
        for _ in range(100):
            self.assertEqual([p['id'] for p in self.search.search('austin lodging')], [1, 2])
        average_ms = (perf_counter() - start) * 1000 / 100
        print(f'\nSR-NF01 assistant run: 100 searches, average {average_ms:.3f} ms.', flush=True)
        self.assertLess(average_ms, 50)


class ProfileSearchAPITests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.server = make_server(Path(self.temp.name) / 'api.db', 0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join(); self.temp.cleanup()

    def request(self, path, method='GET', body=None):
        request = Request(self.base + path, method=method, data=None if body is None else json.dumps(body).encode(),
                          headers={'Content-Type': 'application/json'})
        try:
            response = urlopen(request)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.load(response)

    def test_SR_TC06_stale_profile_is_409_and_unchanged(self):
        status, saved = self.request('/api/profile', 'PUT', VALID)
        self.assertEqual(status, 200)
        status, body = self.request('/api/profile', 'PUT', {**VALID, 'display_name': 'Stale'})
        self.assertEqual((status, body), (409, {'error': 'Your profile changed. Reload before saving again.'}))
        self.assertEqual(self.request('/api/profile'), (200, {'profile': saved['profile']}))

    def test_SR_TC08_no_search_results(self):
        self.assertEqual(self.request('/api/search?q=zzzz'), (200, dict(results=[],
                         message='No results found. Try a different search term.', sample_data=True)))

    def test_SR_TC09_search_validation(self):
        for query, message in (('', 'Enter a search term.'), ('   ', 'Enter a search term.'),
                               ('a' * 81, 'Search terms must be 80 characters or fewer.')):
            with self.subTest(query=query):
                self.assertEqual(self.request('/api/search?' + urlencode({'q': query})), (400, {'error': message}))
        self.assertEqual(self.request('/api/search'), (400, {'error': 'Enter a search term.'}))

    def test_SR_TC10_profile_http_round_trip(self):
        self.assertEqual(self.request('/api/profile'), (200, {'profile': dict(user_id=DEMO_USER,
                         display_name='', email='', phone='', address='', version=0)}))
        status, body = self.request('/api/profile', 'PUT', VALID)
        self.assertEqual((status, body), (200, {'profile': {**VALID, 'user_id': DEMO_USER, 'version': 1}, 'message': 'Profile saved.'}))
        self.assertEqual(self.request('/api/profile', 'PUT', {**VALID, 'email': 'sharad', 'version': 1}),
                         (400, {'error': 'Enter a valid email address.'}))
        self.assertEqual(self.request('/api/profile')[1]['profile'], body['profile'])

    def test_SR_TC17_search_api_message_and_static_module(self):
        status, body = self.request('/api/search?' + urlencode({'q': '  austin lodging  '}))
        self.assertEqual((status, body['message'], body['sample_data']), (200, '2 results for "austin lodging".', True))
        self.assertEqual([p['id'] for p in body['results']], [1, 2])
        self.assertEqual(set(body['results'][0]), {'id', 'name', 'location', 'category', 'rating', 'price', 'snippet'})
        with urlopen(self.base + '/profile_search.js') as response:
            self.assertEqual((response.status, response.headers.get_content_type()), (200, 'text/javascript'))
            self.assertTrue(response.read().startswith(b'// Sharad Rangaraju: UC-03'))


if __name__ == '__main__':
    unittest.main(verbosity=2)
