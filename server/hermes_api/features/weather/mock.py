from datetime import date, timedelta

from .models import CurrentWeather, DailyWeather, WeatherCondition

HIGHS = [64, 61, 59, 62, 63, 61, 62]
CONDITIONS: list[WeatherCondition] = ["sunny", "cloudy", "rainy", "cloudy", "sunny", "sunny"]
FORECAST_DAYS = 16


class MockWeatherProvider:
    async def current(self, place_id: str) -> CurrentWeather:
        return CurrentWeather(temperature=64, condition="sunny")

    async def daily(self, place_id: str, start: date, end: date) -> list[DailyWeather]:
        days = (end - start).days + 1
        return [
            DailyWeather(
                date=start + timedelta(days=i),
                high=HIGHS[i % len(HIGHS)],
                low=HIGHS[i % len(HIGHS)] - 10,
                condition=CONDITIONS[i % len(CONDITIONS)],
                is_typical=(start + timedelta(days=i) - date.today()).days > FORECAST_DAYS,
            )
            for i in range(days)
        ]
