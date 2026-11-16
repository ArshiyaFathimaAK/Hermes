"""UC-12 Share Trip (FR-28, FR-29).
Spenser Saunders, Assignment 4. Drafted with AI assistance (Claude), reviewed and tested.

How sharing works in this demo:
- Only the trip's owner can create a link (NFR-04). Each trip has one link; asking again returns it.
- Creating a link sets the trip's privacy to 'link'.
- The link holds a random token from secrets.token_urlsafe(16): 128 bits, so it can't be guessed.
- Opening a link returns that one trip, read-only: no owner ID, trip ID, version, or any other trip (FR-29).
- Unknown and malformed links get the same message, so a reply never reveals which tokens exist.
"""
import re
import secrets
from .catalog import PLACES
from .repository import NotFoundError

INVALID_LINK = 'This share link is not valid.'
READY_MESSAGE = 'Share link ready. Anyone with this link can view this trip.'
TOKEN_FORMAT = re.compile(r'[A-Za-z0-9_-]{16,64}')


class ShareService:
    """Creates share links for owners and serves the read-only shared view."""

    def __init__(self, repository):
        self.repository = repository

    def create_link(self, user_id, trip_id):
        # The repository checks ownership and reuses an existing token if there is one.
        token = self.repository.get_or_create_share_token(user_id, trip_id, secrets.token_urlsafe(16))
        return dict(token=token, path=f'/?share={token}', message=READY_MESSAGE)

    def view(self, token):
        if not isinstance(token, str) or not TOKEN_FORMAT.fullmatch(token):
            raise NotFoundError(INVALID_LINK)
        trip = self.repository.get_shared(token)
        if trip is None:
            raise NotFoundError(INVALID_LINK)
        places = {p.id: p for p in PLACES}
        stops = [dict(day=i['day'], position=i['position'], name=places[i['place_id']].name,
                      category=places[i['place_id']].category, location=places[i['place_id']].location)
                 for i in trip['items'] if i['place_id'] in places]
        # Only these fields leave the server; user_id, id, version and privacy stay private.
        return dict(name=trip['name'], destinations=trip['destinations'], start_date=trip['start_date'],
                    end_date=trip['end_date'], stops=stops, read_only=True)
