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
from .details import PlaceDetailService  # Reynard: UC-06
from .weather import WeatherService, WeatherUnavailable  # Reynard: UC-07
from .cost import CostService        # Spenser Saunders: UC-11
from .sharing import ShareService    # Spenser Saunders: UC-12
from .profile import ProfileRepository, ProfileService  # Sharad: UC-03
from .search import SearchService  # Sharad: UC-04

ROOT = Path(__file__).resolve().parent.parent / 'web'
DEMO_USER = 'demo-arshiya'

def make_server(db_path, port=8000, weather_provider=None):
    repo = TripRepository(db_path)
    trips, catalog = TripService(repo), CatalogService()
    details, weather = PlaceDetailService(), WeatherService(weather_provider)  # Reynard: UC-06/07
    costs, sharing = CostService(repo), ShareService(repo)  # Spenser Saunders: UC-11, UC-12
    profiles = ProfileService(ProfileRepository(db_path))  # Sharad: UC-03, fixed demo identity; no real Supabase Auth.
    search = SearchService()  # Sharad: UC-04
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
            # Sharad: UC-03 uses the existing demo identity and error mapping.
            if path == '/api/profile':
                if self.command == 'GET':
                    return self.send_json(200, {'profile': profiles.get(DEMO_USER)})
                if self.command == 'PUT':
                    return self.send_json(200, {'profile': profiles.save(DEMO_USER, self.read_json()), 'message': 'Profile saved.'})
            # Sharad: UC-04 ranked keyword search, separate from UC-05 filters.
            if self.command == 'GET' and path == '/api/search':
                args = {k: v[-1] for k, v in parse_qs(parts.query, keep_blank_values=True).items()}
                query = args.get('q', '').strip()
                results = search.search(query)
                message = f'{len(results)} results for "{query}".' if results else 'No results found. Try a different search term.'
                return self.send_json(200, {'results': results, 'message': message, 'sample_data': True})
            if self.command == 'GET' and path == '/api/catalog':
                args = {k: v[-1] for k, v in parse_qs(parts.query).items()}
                return self.send_json(200, {'results': catalog.search(args), 'sample_data': True})
            if self.command == 'GET' and path == '/api/config':
                return self.send_json(200, {'locations': LOCATIONS, 'user': DEMO_USER, 'demo': True})
            # Reynard: UC-06 place details and UC-07 weather (read-only endpoints)
            if self.command == 'GET' and path == '/api/weather':
                args = {k: v[-1] for k, v in parse_qs(parts.query).items()}
                return self.send_json(200, weather.forecast(args))
            segs = path.strip('/').split('/')
            if self.command == 'GET' and len(segs) == 3 and segs[:2] == ['api', 'places'] and segs[2].isdigit():
                return self.send_json(200, {'place': details.get(int(segs[2]))})
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
                # Spenser Saunders: UC-11 cost estimate and UC-12 share link for the owner's trip.
                if self.command == 'GET' and len(segments) == 4 and segments[3] == 'cost':
                    return self.send_json(200, {'estimate': costs.estimate(DEMO_USER, trip_id)})
                if self.command == 'POST' and len(segments) == 4 and segments[3] == 'share':
                    return self.send_json(200, sharing.create_link(DEMO_USER, trip_id))
            # Spenser Saunders: UC-12 read-only view for anyone holding the link. No user identity is used.
            if self.command == 'GET' and segments[:2] == ['api', 'shared'] and len(segments) in (2, 3):
                return self.send_json(200, {'trip': sharing.view(segments[2] if len(segments) == 3 else '')})
            if not path.startswith('/api/') and self.command == 'GET':
                # Sharad: UC-03/04 front-end module registered like details_weather.js.
                name = {'/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css', '/details_weather.js': 'details_weather.js', '/profile_search.js': 'profile_search.js'}.get(path)
                if name:
                    payload = (ROOT / name).read_bytes()
                    self.send_response(200)
                    # Sharad: UC-03/04 JavaScript content type.
                    self.send_header('Content-Type', {'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8','details_weather.js':'text/javascript; charset=utf-8','profile_search.js':'text/javascript; charset=utf-8'}[name])
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
            except WeatherUnavailable as error:
                self.send_json(503, {'error': str(error)})
            except sqlite3.Error:
                self.send_json(503, {'error': 'Could not save or load data. Please retry. Your unsaved form is still available.'})
            except Exception:
                logging.exception('Unexpected server error')
                self.send_json(500, {'error': 'Something went wrong. Please retry.'})
        do_GET = handle_request
        do_POST = handle_request
        do_PUT = handle_request
    return ThreadingHTTPServer(('127.0.0.1', port), Handler)
