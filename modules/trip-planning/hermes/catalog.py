"""Seeded catalog adapter; synthetic sample data, never a live lodging provider."""
from dataclasses import asdict
from .models import Place

PLACES = (
    Place(1, 'Lakeside House', 'Austin', 'lodging', 145, 4.8, ('wifi', 'parking')),
    Place(2, 'The Congress Stay', 'Austin', 'lodging', 169, 4.6, ('wifi', 'pool')),
    Place(3, 'Walk Lady Bird Lake', 'Austin', 'destination', 0, 4.9),
    Place(4, 'South Congress', 'Austin', 'destination', 28, 4.5),
    Place(5, 'Arts District Walk', 'Dallas', 'destination', 0, 4.7),
    Place(6, 'Uptown Stay', 'Dallas', 'lodging', 130, 4.4, ('wifi', 'parking')),
    Place(7, 'River Walk', 'San Antonio', 'destination', 0, 4.8),
    Place(8, 'Riverfront Inn', 'San Antonio', 'lodging', 118, 4.3, ('wifi',)),
)
LOCATIONS = ('Austin', 'Dallas', 'San Antonio')

class ValidationError(ValueError):
    """A safe, specific message that the interface may display."""

class CatalogService:
    """Validate filters and return the intersection of selected criteria."""
    def search(self, params):
        query = str(params.get('q', '')).strip().casefold()
        location = str(params.get('location', '')).strip()
        category = str(params.get('category', '')).strip()
        if location and location not in LOCATIONS:
            raise ValidationError('Choose a supported location.')
        if category not in ('', 'lodging', 'destination'):
            raise ValidationError('Choose a supported category.')
        def number(key, default):
            try:
                value = float(params.get(key) or default)
                import math
                if not math.isfinite(value) or value < 0:
                    raise ValueError()
                return value
            except (ValueError, TypeError):
                raise ValidationError('Enter valid non-negative numeric filters.')
        low, high = number('min_price', 0), number('max_price', 100000)
        rating = number('rating', 0)
        if low > high:
            raise ValidationError('Minimum price must not exceed maximum price.')
        if rating > 5:
            raise ValidationError('Rating must be between 0 and 5.')
        amenities = set(filter(None, str(params.get('amenities', '')).split(',')))
        if not amenities <= {'wifi', 'pool', 'parking'}:
            raise ValidationError('Choose supported amenities.')
        return [asdict(p) for p in PLACES
                if (not query or query in (p.name + ' ' + p.location).casefold())
                and (not location or p.location == location)
                and (not category or p.category == category)
                and low <= p.price <= high and p.rating >= rating
                and amenities <= set(p.amenities)]
