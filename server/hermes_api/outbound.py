"""Calling outside services. Live providers use this so timeouts and failures behave the same."""

from typing import Any

import httpx

from .config import get_settings
from .errors import UpstreamUnavailable


async def get_json(url: str, *, params: dict[str, Any] | None = None, service: str) -> Any:
    """GET a JSON response. `service` names the provider in the message people see."""
    try:
        async with httpx.AsyncClient(timeout=get_settings().outbound_timeout) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, ValueError) as error:
        raise UpstreamUnavailable(f"{service} is not responding. Try again soon.") from error
