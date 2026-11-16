"""UC-06 View Destination/Lodging details.

Author: Reynard Landreneau (AI-assisted draft, reviewed by author).
Purpose: return the full detail record for one catalog place (description, address,
hours or check-in times, price label, provider link). Reads the shared catalog from
hermes/catalog.py and never writes anything. All data is synthetic sample data; the
provider links point at example.com and are NOT real booking links.
"""
from dataclasses import asdict
from .catalog import PLACES
from .repository import NotFoundError

# Extra detail fields per place id. Keys must match ids in catalog.PLACES.
# provider_url values are placeholders until a real lodging/attraction provider is chosen.
_DETAILS = {
    1: dict(description='Quiet two-bedroom house a short walk from the lake trail, with a fenced yard.',
            address='101 Lakeshore Trail, Austin, TX (sample address)',
            schedule='Check-in 3:00 PM · Check-out 11:00 AM',
            provider='Sample Stays', provider_url='https://example.com/stays/lakeside-house'),
    2: dict(description='Boutique hotel near downtown with a rooftop pool and breakfast bar.',
            address='202 Congress Ave, Austin, TX (sample address)',
            schedule='Check-in 4:00 PM · Check-out 11:00 AM',
            provider='Sample Stays', provider_url='https://example.com/stays/congress-stay'),
    3: dict(description='Flat, shaded 10-mile loop around the lake with skyline views.',
            address='Lady Bird Lake Trailhead, Austin, TX (sample address)',
            schedule='Open daily · 5:00 AM–10:00 PM',
            provider='Sample Attractions', provider_url='https://example.com/attractions/lady-bird-lake'),
    4: dict(description='Shops, food trucks and live music along a lively avenue.',
            address='South Congress Ave, Austin, TX (sample address)',
            schedule='Open daily · 10:00 AM–9:00 PM',
            provider='Sample Attractions', provider_url='https://example.com/attractions/south-congress'),
    5: dict(description='Self-guided walk past galleries, sculpture and murals.',
            address='Flora Street, Dallas, TX (sample address)',
            schedule='Open daily · 8:00 AM–8:00 PM',
            provider='Sample Attractions', provider_url='https://example.com/attractions/arts-district-walk'),
    6: dict(description='Modern apartment-style rooms in Uptown with covered parking.',
            address='303 McKinney Ave, Dallas, TX (sample address)',
            schedule='Check-in 3:00 PM · Check-out 11:00 AM',
            provider='Sample Stays', provider_url='https://example.com/stays/uptown-stay'),
    7: dict(description='Landscaped riverside path lined with cafes and boat tours.',
            address='Riverwalk, San Antonio, TX (sample address)',
            schedule='Open daily · 24 hours',
            provider='Sample Attractions', provider_url='https://example.com/attractions/river-walk'),
    8: dict(description='Small inn on the river with a free breakfast and Wi-Fi.',
            address='808 Riverfront Dr, San Antonio, TX (sample address)',
            schedule='Check-in 2:00 PM · Check-out 10:00 AM',
            provider='Sample Stays', provider_url='https://example.com/stays/riverfront-inn'),
}


class PlaceDetailService:
    """Look up one place and merge catalog fields with its detail fields."""

    def get(self, place_id):
        # type(...) is int also rejects True/False, which are ints in Python.
        place = next((p for p in PLACES if type(place_id) is int and p.id == place_id), None)
        if place is None or place.id not in _DETAILS:
            raise NotFoundError('Destination or lodging not found.')
        extra = _DETAILS[place.id]
        record = asdict(place)
        record['amenities'] = list(place.amenities)
        record['description'] = extra['description']
        record['address'] = extra['address']
        record['schedule'] = extra['schedule']
        record['price_label'] = self._price_label(place)
        record['provider'] = {'name': extra['provider'], 'url': extra['provider_url']}
        record['sample_data'] = True
        return record

    @staticmethod
    def _price_label(place):
        if place.price == 0:
            return 'Free'
        return f'${place.price} / night' if place.category == 'lodging' else f'${place.price} estimated'
