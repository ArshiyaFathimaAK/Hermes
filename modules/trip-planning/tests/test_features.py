"""Behavioral tests with concrete fixtures, isolated databases, and expected outcomes."""
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from unittest.mock import patch
import sqlite3
from hermes.catalog import CatalogService, ValidationError
from hermes.repository import TripRepository, NotFoundError, ConflictError
from hermes.services import TripService
from hermes.api import make_server

VALID = dict(name='Austin weekend', destinations=['Austin'], start_date='2026-11-20', end_date='2026-11-22', privacy='private')

class FeatureTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'test.db'
        self.repo = TripRepository(self.path)
        self.service = TripService(self.repo)
        self.catalog = CatalogService()
    def tearDown(self):
        self.temp.cleanup()
    def new_trip(self, **changes):
        return self.service.create('arshiya', {**VALID, **changes})
    def item(self, uid='a', pid=3, day='2026-11-20'):
        return dict(id=uid, place_id=pid, day=day)
    def test_TC01_combined_filters(self):
        result=self.catalog.search(dict(location='Austin', category='lodging', max_price='150', amenities='wifi,parking'))
        self.assertEqual([p['id'] for p in result],[1])
    def test_TC02_case_insensitive_search(self):
        self.assertEqual([p['id'] for p in self.catalog.search({'q':'  LAKESIDE  '})],[1])
    def test_TC03_no_results(self):
        self.assertEqual(self.catalog.search({'q':'zzzz'}),[])
    def test_TC04_clear_filters(self):
        self.assertEqual(len(self.catalog.search({'location':'Dallas'})),2)
        self.assertEqual(len(self.catalog.search({})),8)
    def test_TC05_invalid_price_range(self):
        with self.assertRaisesRegex(ValidationError,'Minimum price must not exceed maximum price.'):
            self.catalog.search(dict(min_price='200', max_price='100'))
    def test_TC06_malformed_numeric_filters(self):
        for value in ('abc','NaN','inf','-1'):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                self.catalog.search({'max_price':value})
    def test_TC07_multi_destination_create(self):
        trip=self.new_trip(destinations=['Austin','Dallas','Austin'])
        self.assertEqual(trip['destinations'],['Austin','Dallas'])
        self.assertEqual(trip['user_id'],'arshiya')
        self.assertEqual(trip['items'],[])
    def test_TC08_missing_fields(self):
        for changes,message in [({'name':' '},'Enter a trip name.'),({'destinations':[]},'Select at least one destination.')]:
            with self.subTest(changes=changes), self.assertRaisesRegex(ValidationError,message):
                self.new_trip(**changes)
        self.assertEqual(self.repo.list('arshiya'),[])
    def test_TC09_reversed_dates(self):
        with self.assertRaisesRegex(ValidationError,'End date must be on or after start date.'):
            self.new_trip(end_date='2026-11-19')
        self.assertEqual(self.repo.list('arshiya'),[])
    def test_TC10_invalid_calendar_date(self):
        with self.assertRaisesRegex(ValidationError,'Enter valid dates in YYYY-MM-DD format.'):
            self.new_trip(start_date='2026-02-30')
    def test_TC11_single_day_trip(self):
        t=self.new_trip(end_date='2026-11-20')
        self.assertEqual(t['start_date'],t['end_date'])
    def test_TC12_add_destination_and_lodging(self):
        t=self.new_trip()
        result=self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[self.item(),self.item('b',1,'2026-11-21')]))
        self.assertEqual([(x['place_id'],x['day'],x['position']) for x in result['items']],[(3,'2026-11-20',0),(1,'2026-11-21',0)])
    def test_TC13_reorder_persisted(self):
        t=self.new_trip()
        self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[self.item('a',3),self.item('b',1)]))
        self.service.save_itinerary('arshiya',t['id'],dict(version=1,items=[self.item('b',1),self.item('a',3)]))
        result=TripRepository(self.path).get('arshiya',t['id'])
        self.assertEqual([x['id'] for x in result['items']],['b','a'])
        self.assertEqual([x['position'] for x in result['items']],[0,1])
    def test_TC14_day_outside_trip(self):
        t=self.new_trip()
        with self.assertRaisesRegex(ValidationError,'Choose an itinerary day within the trip dates.'):
            self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[self.item(day='2026-11-23')]))
        self.assertEqual(self.repo.get('arshiya',t['id'])['version'],0)
    def test_TC15_unknown_place(self):
        t=self.new_trip()
        with self.assertRaisesRegex(ValidationError,'Choose an available destination or lodging.'):
            self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[self.item(pid=999)]))
    def test_TC16_duplicate_item_id(self):
        t=self.new_trip()
        with self.assertRaisesRegex(ValidationError,'Every itinerary item needs a unique ID.'):
            self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[self.item(),self.item()]))
    def test_TC17_wrong_destination(self):
        t=self.new_trip()
        with self.assertRaisesRegex(ValidationError,'Choose a place in one of this trip'):
            self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[self.item(pid=5)]))
    def test_TC18_stale_version(self):
        t=self.new_trip()
        self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[self.item()]))
        with self.assertRaisesRegex(ConflictError,'This itinerary changed.'):
            self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[]))
        self.assertEqual(len(self.repo.get('arshiya',t['id'])['items']),1)
    def test_TC19_rollback_failed_save(self):
        t=self.new_trip()
        self.service.save_itinerary('arshiya',t['id'],dict(version=0,items=[self.item()]))
        with self.repo.connection() as db:
            db.execute("CREATE TRIGGER force_fail BEFORE INSERT ON itinerary_items BEGIN SELECT RAISE(ABORT, 'injected failure'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            self.service.save_itinerary('arshiya',t['id'],dict(version=1,items=[self.item('b',1)]))
        result=self.repo.get('arshiya',t['id'])
        self.assertEqual([x['id'] for x in result['items']],['a'])
        self.assertEqual(result['version'],1)
    def test_TC20_owner_isolation(self):
        t=self.new_trip()
        with self.assertRaisesRegex(NotFoundError,'Trip not found.'):
            self.repo.get('other-user',t['id'])
        with self.assertRaises(NotFoundError):
            self.service.save_itinerary('other-user',t['id'],dict(version=0,items=[]))
    def test_TC21_trip_survives_reopen(self):
        t=self.new_trip()
        self.assertEqual(TripRepository(self.path).get('arshiya',t['id'])['name'],'Austin weekend')
    def test_TC22_sql_like_search_is_literal(self):
        self.assertEqual(self.catalog.search({'q':"' OR 1=1 --"}),[])
        self.assertEqual(len(self.catalog.search({})),8)

class APITests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.server=make_server(Path(self.temp.name)/'api.db',0)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True)
        self.thread.start()
        self.base=f'http://127.0.0.1:{self.server.server_port}'
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join();self.temp.cleanup()
    def request(self,path,method='GET',body=None):
        req=Request(self.base+path,method=method,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json'})
        try:
            response=urlopen(req)
        except HTTPError as error:
            response=error
        with response:
            return response.status,json.load(response)
    def test_TC23_api_create_and_read(self):
        status,body=self.request('/api/trips','POST',VALID)
        self.assertEqual(status,201);self.assertEqual(body['message'],'Trip saved successfully.')
        status,result=self.request('/api/trips/'+str(body['trip']['id']))
        self.assertEqual(status,200);self.assertEqual(result['trip']['name'],'Austin weekend')
    def test_TC24_api_validation(self):
        status,body=self.request('/api/trips','POST',{**VALID,'end_date':'2026-11-01'})
        self.assertEqual(status,400);self.assertEqual(body['error'],'End date must be on or after start date.')
    def test_TC25_api_failed_save(self):
        with patch.object(TripRepository,'create',side_effect=sqlite3.OperationalError('database locked')):
            status,body=self.request('/api/trips','POST',VALID)
        self.assertEqual(status,503)
        self.assertEqual(body['error'],'Could not save or load data. Please retry. Your unsaved form is still available.')
        self.assertEqual(self.request('/api/trips')[1]['trips'],[])
    def test_TC26_malformed_json(self):
        request=Request(self.base+'/api/trips',data=b'{bad',method='POST')
        with self.assertRaises(HTTPError) as error:
            urlopen(request)
        self.assertEqual(error.exception.code,400)
        self.assertEqual(json.load(error.exception)['error'],'Send valid JSON under 200 KB.')
    def test_TC27_missing_trip(self):
        self.assertEqual(self.request('/api/trips/999')[0],404)
    def test_TC28_api_search_validation(self):
        self.assertEqual(self.request('/api/catalog?min_price=200&max_price=100')[0],400)

if __name__=='__main__':unittest.main(verbosity=2)
