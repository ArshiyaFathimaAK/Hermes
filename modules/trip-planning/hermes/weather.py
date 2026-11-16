"""UC-07 View Weather.

Author: Reynard Landreneau (AI-assisted draft, reviewed by author).
Purpose: validate a location and date range, ask a weather provider for a daily
forecast, and return it in a fixed shape. The provider is an interchangeable adapter:
SampleWeatherProvider is deterministic synthetic data (no network). A real provider
only needs a `forecast(location, start, end)` method that returns the same day dicts
or raises an exception. Any provider failure becomes WeatherUnavailable, and the
service never invents forecast data to fill the gap.
"""
import zlib
from datetime import timedelta
from .catalog import LOCATIONS, ValidationError
from .services import TripService

MAX_DAYS = 16  # demo policy, not an approved requirement
UNAVAILABLE = 'Weather is temporarily unavailable. Please retry.'


class WeatherUnavailable(Exception):
    """Provider timed out, errored or returned nothing usable."""


# Rough monthly (high, low) in °F, index 0 = January. Synthetic, for demo only.
_CLIMATE = {
    'Austin':      ([62, 66, 73, 80, 86, 92, 96, 97, 91, 83, 72, 64], [42, 45, 52, 59, 67, 73, 75, 75, 70, 61, 51, 43]),
    'Dallas':      ([57, 61, 69, 77, 84, 92, 96, 97, 89, 79, 67, 58], [37, 41, 49, 57, 66, 74, 78, 77, 70, 59, 48, 39]),
    'San Antonio': ([63, 67, 74, 81, 87, 92, 96, 97, 91, 83, 72, 64], [43, 46, 53, 61, 69, 74, 76, 76, 72, 62, 52, 44]),
}
_CONDITIONS = (('Sunny', 5), ('Partly cloudy', 15), ('Cloudy', 30), ('Light rain', 60), ('Thunderstorms', 75))


class SampleWeatherProvider:
    """Deterministic synthetic forecast. crc32 (not hash()) so results are stable across runs."""

    def forecast(self, location, start, end):
        highs, lows = _CLIMATE[location]
        days, day = [], start
        while day <= end:
            seed = zlib.crc32(f'{location}|{day.isoformat()}'.encode())
            shift = seed % 11 - 5
            condition, rain = _CONDITIONS[(seed >> 8) % len(_CONDITIONS)]
            high = highs[day.month - 1] + shift
            low = min(lows[day.month - 1] + shift, high)
            days.append(dict(date=day.isoformat(), high_f=high, low_f=low,
                             condition=condition, precip_chance=rain))
            day += timedelta(days=1)
        return days


class WeatherService:
    def __init__(self, provider=None):
        self.provider = provider or SampleWeatherProvider()

    def forecast(self, params):
        location = str(params.get('location', '')).strip()
        if location not in LOCATIONS:
            raise ValidationError('Choose a supported location.')
        start = TripService.parse_date(params.get('start_date'))
        end = TripService.parse_date(params.get('end_date'))
        if end < start:
            raise ValidationError('End date must be on or after start date.')
        if (end - start).days + 1 > MAX_DAYS:
            raise ValidationError(f'Weather can be shown for at most {MAX_DAYS} days at a time.')
        try:
            days = self.provider.forecast(location, start, end)
        except Exception as error:  # timeouts, network errors, bad provider code
            raise WeatherUnavailable(UNAVAILABLE) from error
        if not days:
            raise WeatherUnavailable(UNAVAILABLE)
        return {'location': location, 'unit': 'F', 'days': days, 'sample_data': True}
