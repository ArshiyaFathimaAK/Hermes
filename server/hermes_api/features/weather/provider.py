"""UC-07 View Weather.

To go live: write a class with these methods in live.py, then change `get_weather_provider`.
"""

from datetime import date
from typing import Protocol

from .models import CurrentWeather, DailyWeather


class WeatherProvider(Protocol):
    async def current(self, place_id: str) -> CurrentWeather: ...

    async def daily(self, place_id: str, start: date, end: date) -> list[DailyWeather]:
        """One entry per day, both ends included. Past the forecast window, set is_typical."""
        ...


def get_weather_provider() -> WeatherProvider:
    # Open-Meteo needs no API key, so there is nothing to fall back from. Tests swap in the mock
    # (see tests/conftest.py), so they need no network.
    from .live import LiveWeatherProvider

    return LiveWeatherProvider()
