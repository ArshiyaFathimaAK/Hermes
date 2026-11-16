"""UC-04 Search for Destination (FR-07, FR-08).

Author: Sharad Rangaraju (AI-assisted draft; author review pending).
Purpose: rank previews from the shared synthetic catalog and place descriptions.
This service reads other modules' data and does not own or persist place data.
"""
from .catalog import PLACES, ValidationError
from .details import PlaceDetailService


class SearchService:
    def search(self, q):
        query = q.strip() if isinstance(q, str) else ''
        if not query:
            raise ValidationError('Enter a search term.')
        if len(query) > 80:
            raise ValidationError('Search terms must be 80 characters or fewer.')
        words, matches = query.lower().split(), []
        details = PlaceDetailService()
        for place in PLACES:
            description = details.get(place.id)['description']
            fields = (place.name.lower(), place.location.lower(), place.category.lower(), description.lower())
            if not all(any(word in field for field in fields) for word in words):
                continue
            score = sum(weight for word in words for field, weight in zip(fields, (3, 2, 1, 1)) if word in field)
            preview = dict(id=place.id, name=place.name, location=place.location, category=place.category,
                           rating=place.rating, price=place.price, snippet=description[:90])
            matches.append((score, preview))
        matches.sort(key=lambda match: (-match[0], -match[1]['rating'], match[1]['name']))
        return [preview for score, preview in matches]
