"""Matches hermes/src/domain/weather.ts. Temperatures are always Fahrenheit; the app converts."""

from datetime import date
from typing import Literal

from ...models import ApiModel

WeatherCondition = Literal["sunny", "cloudy", "rainy"]


class CurrentWeather(ApiModel):
    temperature: float
    condition: WeatherCondition


class DailyWeather(ApiModel):
    date: date
    high: float
    low: float
    condition: WeatherCondition
    # True when this is past-years weather rather than a forecast.
    is_typical: bool
