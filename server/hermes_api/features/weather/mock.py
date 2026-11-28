"""Sample weather, from the shared sample data."""

from datetime import date, timedelta
from typing import Any

from ...sample_data import sample_data
from .models import CurrentWeather, DailyWeather


def sample_weather(place_id: str) -> dict[str, Any]:
    weather = sample_data()["weather"]
    return weather.get(place_id, weather["default"])


class MockWeatherProvider:
    async def current(self, place_id: str) -> CurrentWeather:
        return CurrentWeather.model_validate(sample_weather(place_id)["current"])

    async def daily(self, place_id: str, start: date, end: date) -> list[DailyWeather]:
        weather = sample_weather(place_id)
        highs, conditions = weather["highs"], weather["conditions"]
        forecast_days = sample_data()["forecastDays"]
        days = []
        for i in range((end - start).days + 1):
            day = start + timedelta(days=i)
            high = highs[i % len(highs)]
            days.append(
                DailyWeather(
                    date=day,
                    high=high,
                    low=high - 10,
                    condition=conditions[i % len(conditions)],
                    is_typical=(day - date.today()).days > forecast_days,
                )
            )
        return days
