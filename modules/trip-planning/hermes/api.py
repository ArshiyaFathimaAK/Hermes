"""Local HTTP JSON API and static UI. Single fixed demo identity, not production authentication."""
import json
import logging
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from .catalog import CatalogService, LOCATIONS, ValidationError
from .repository import TripRepository, NotFoundError, ConflictError
from .services import TripService

ROOT = Path(__file__).resolve().parent.parent / 'web'
DEMO_USER = 'demo-arshiya'

def make_server(db_path, port=8000):
    repo = TripRepository(db_path)
    trips, catalog = TripService(repo), CatalogService()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass
        def send_json(self, status, body):
            payload = json.dumps(body).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(payload)
        def read_json(self):
            try:
                size = int(self.headers.get('Content-Length', 0))
                if not 0 < size <= 200000:
                    raise ValueError()
                return json.loads(self.rfile.read(size))
            except (ValueError, UnicodeDecodeError):
                raise ValidationError('Send valid JSON under 200 KB.')
        def route(self):
            parts = urlsplit(self.path)
            path = parts.path
            if self.command == 'GET' and path == '/api/catalog':
                args = {k: v[-1] for k, v in parse_qs(parts.query).items()}
                return self.send_json(200, {'results': catalog.search(args), 'sample_data': True})
            if self.command == 'GET' and path == '/api/config':
                return self.send_json(200, {'locations': LOCATIONS, 'user': DEMO_USER, 'demo': True})
            if path == '/api/trips':
                if self.command == 'GET':
                    return self.send_json(200, {'trips': repo.list(DEMO_USER)})
                if self.command == 'POST':
                    return self.send_json(201, {'trip': trips.create(DEMO_USER, self.read_json()), 'message': 'Trip saved successfully.'})
            segments = path.strip('/').split('/')
            if len(segments) in (3, 4) and segments[:2] == ['api', 'trips'] and segments[2].isdigit():
                trip_id = int(segments[2])
                if self.command == 'GET' and len(segments) == 3:
                    return self.send_json(200, {'trip': repo.get(DEMO_USER, trip_id)})
                if self.command == 'PUT' and len(segments) == 4 and segments[3] == 'itinerary':
                    return self.send_json(200, {'trip': trips.save_itinerary(DEMO_USER, trip_id, self.read_json()), 'message': 'Itinerary saved successfully.'})
            if not path.startswith('/api/') and self.command == 'GET':
                name = {'/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css'}.get(path)
                if name:
                    payload = (ROOT / name).read_bytes()
                    self.send_response(200)
                    self.send_header('Content-Type', {'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8'}[name])
                    self.send_header('Content-Length', str(len(payload)))
                    self.end_headers()
                    return self.wfile.write(payload)
            self.send_json(404, {'error': 'Not found.'})
        def handle_request(self):
            try:
                self.route()
            except ValidationError as error:
                self.send_json(400, {'error': str(error)})
            except NotFoundError as error:
                self.send_json(404, {'error': str(error)})
            except ConflictError as error:
                self.send_json(409, {'error': str(error)})
            except sqlite3.Error:
                self.send_json(503, {'error': 'Could not save or load data. Please retry. Your unsaved form is still available.'})
            except Exception:
                logging.exception('Unexpected server error')
                self.send_json(500, {'error': 'Something went wrong. Please retry.'})
        do_GET = handle_request
        do_POST = handle_request
        do_PUT = handle_request
    return ThreadingHTTPServer(('127.0.0.1', port), Handler)
