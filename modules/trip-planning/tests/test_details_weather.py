"""Tests for UC-06 (place details) and UC-07 (weather). Author: Reynard Landreneau.
AI-assisted draft; each test has concrete input data and an exact expected result.
Run: python -m unittest discover -s tests -v
"""
import json
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock
from urllib.request import urlopen
from urllib.error import HTTPError
from hermes.api import make_server
from hermes.catalog import PLACES, ValidationError
from hermes.details import PlaceDetailService
from hermes.repository import NotFoundError
from hermes.weather import WeatherService, WeatherUnavailable, SampleWeatherProvider, UNAVAILABLE

AUSTIN = dict(location='Austin', start_date='2026-11-20', end_date='2026-11-22')


class DetailTests(unittest.TestCase):
    def setUp(self):
        self.service = PlaceDetailService()

    def test_RL_TC01_lodging_details(self):
        p = self.service.get(1)
        self.assertEqual((p['name'], p['location'], p['category']), ('Lakeside House', 'Austin', 'lodging'))
        self.assertEqual(p['price_label'], '$145 / night')
        self.assertEqual(p['amenities'], ['wifi', 'parking'])
        self.assertEqual(p['schedule'], 'Check-in 3:00 PM · Check-out 11:00 AM')
        self.assertEqual(p['provider'], {'name': 'Sample Stays', 'url': 'https://example.com/stays/lakeside-house'})
        self.assertTrue(p['description'] and p['address'])
        self.assertIs(p['sample_data'], True)

    def test_RL_TC03_destination_details(self):
        p = self.service.get(3)
        self.assertEqual((p['name'], p['category']), ('Walk Lady Bird Lake', 'destination'))
        self.assertEqual(p['price_label'], 'Free')
        self.assertEqual(p['schedule'], 'Open daily · 5:00 AM–10:00 PM')
        self.assertEqual(self.service.get(4)['price_label'], '$28 estimated')

    def test_RL_TC04_unknown_place(self):
        for bad in (999, 0, -1, '1', None, True, 1.0):
            with self.subTest(place_id=bad), self.assertRaisesRegex(NotFoundError, 'Destination or lodging not found.'):
                self.service.get(bad)

    def test_RL_TC06_every_catalog_place_has_matching_details(self):
        for place in PLACES:
            with self.subTest(place=place.id):
                d = self.service.get(place.id)
                self.assertEqual((d['id'], d['name'], d['price'], d['rating']), (place.id, place.name, place.price, place.rating))
                self.assertTrue(d['provider']['url'].startswith('https://'))


class WeatherTests(unittest.TestCase):
    def setUp(self):
        self.service = WeatherService()

    def test_RL_TC02_forecast_for_trip_dates(self):
        r = self.service.forecast(AUSTIN)
        self.assertEqual((r['location'], r['unit'], r['sample_data']), ('Austin', 'F', True))
        self.assertEqual([d['date'] for d in r['days']], ['2026-11-20', '2026-11-21', '2026-11-22'])
        for d in r['days']:
            self.assertEqual(set(d), {'date', 'high_f', 'low_f', 'condition', 'precip_chance'})
            self.assertLessEqual(d['low_f'], d['high_f'])
            self.assertTrue(0 <= d['precip_chance'] <= 100)

    def test_RL_TC07_unsupported_or_missing_location(self):
        for loc in ('Paris', '', None):
            with self.subTest(location=loc), self.assertRaisesRegex(ValidationError, 'Choose a supported location.'):
                self.service.forecast({**AUSTIN, 'location': loc})

    def test_RL_TC08_reversed_dates(self):
        with self.assertRaisesRegex(ValidationError, 'End date must be on or after start date.'):
            self.service.forecast({**AUSTIN, 'start_date': '2026-11-22', 'end_date': '2026-11-20'})

    def test_RL_TC09_invalid_or_missing_dates(self):
        for changes in ({'start_date': '2026-02-30'}, {'end_date': 'tomorrow'}, {'start_date': None}, {'end_date': ''}):
            with self.subTest(changes=changes), self.assertRaisesRegex(ValidationError, 'Enter valid dates in YYYY-MM-DD format.'):
                self.service.forecast({**AUSTIN, **changes})

    def test_RL_TC10_range_limit_boundary(self):
        self.assertEqual(len(self.service.forecast({**AUSTIN, 'end_date': '2026-12-05'})['days']), 16)
        with self.assertRaisesRegex(ValidationError, 'at most 16 days'):
            self.service.forecast({**AUSTIN, 'end_date': '2026-12-06'})

    def test_RL_TC11_single_day(self):
        r = self.service.forecast({**AUSTIN, 'end_date': '2026-11-20'})
        self.assertEqual([d['date'] for d in r['days']], ['2026-11-20'])

    def test_RL_TC12_provider_outage_returns_no_data(self):
        for failure in (TimeoutError('slow'), ConnectionError('down'), RuntimeError('bug')):
            provider = Mock(); provider.forecast.side_effect = failure
            with self.subTest(failure=type(failure).__name__), self.assertRaisesRegex(WeatherUnavailable, UNAVAILABLE):
                WeatherService(provider).forecast(AUSTIN)
        empty = Mock(); empty.forecast.return_value = []
        with self.assertRaises(WeatherUnavailable):
            WeatherService(empty).forecast(AUSTIN)

    def test_RL_TC13_sample_forecast_is_deterministic(self):
        a, b = self.service.forecast(AUSTIN), WeatherService(SampleWeatherProvider()).forecast(AUSTIN)
        self.assertEqual(a, b)

    def test_RL_TC16_invalid_input_never_calls_provider(self):
        provider = Mock()
        with self.assertRaises(ValidationError):
            WeatherService(provider).forecast({**AUSTIN, 'location': 'Paris'})
        provider.forecast.assert_not_called()


class DetailsWeatherAPITests(unittest.TestCase):
    def start(self, provider=None):
        self.temp = tempfile.TemporaryDirectory()
        self.server = make_server(Path(self.temp.name) / 'api.db', 0, provider)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'
        self.addCleanup(self.stop)

    def stop(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join(); self.temp.cleanup()

    def get(self, path):
        try:
            response = urlopen(self.base + path)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.load(response)

    def test_RL_TC14_api_place_details(self):
        self.start()
        status, body = self.get('/api/places/1')
        self.assertEqual(status, 200)
        self.assertEqual(body['place']['name'], 'Lakeside House')
        self.assertEqual(body['place']['provider']['url'], 'https://example.com/stays/lakeside-house')

    def test_RL_TC05_api_missing_or_malformed_place_id(self):
        self.start()
        status, body = self.get('/api/places/999')
        self.assertEqual((status, body['error']), (404, 'Destination or lodging not found.'))
        for bad in ('/api/places/abc', '/api/places/-1', '/api/places/'):
            with self.subTest(path=bad):
                self.assertEqual(self.get(bad)[0], 404)

    def test_RL_TC15_api_weather_success_and_validation(self):
        self.start()
        status, body = self.get('/api/weather?location=Austin&start_date=2026-11-20&end_date=2026-11-22')
        self.assertEqual(status, 200); self.assertEqual(len(body['days']), 3)
        status, body = self.get('/api/weather?location=Austin&start_date=2026-11-22&end_date=2026-11-20')
        self.assertEqual((status, body['error']), (400, 'End date must be on or after start date.'))
        self.assertEqual(self.get('/api/weather')[0], 400)

    def test_RL_TC17_api_weather_outage_is_503_without_forecast(self):
        provider = Mock(); provider.forecast.side_effect = TimeoutError('provider timeout')
        self.start(provider)
        status, body = self.get('/api/weather?location=Austin&start_date=2026-11-20&end_date=2026-11-22')
        self.assertEqual(status, 503)
        self.assertEqual(body, {'error': 'Weather is temporarily unavailable. Please retry.'})

if __name__ == '__main__':
    unittest.main(verbosity=2)
