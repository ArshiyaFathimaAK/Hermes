from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends

from ...errors import ApiError
from .models import CurrentWeather, DailyWeather
from .provider import WeatherProvider, get_weather_provider

router = APIRouter(prefix="/places/{place_id}/weather", tags=["weather"])
Provider = Annotated[WeatherProvider, Depends(get_weather_provider)]

MAX_DAYS = 366


@router.get("/current")
async def current(place_id: str, provider: Provider) -> CurrentWeather:
    return await provider.current(place_id)


@router.get("/daily")
async def daily(place_id: str, start: date, end: date, provider: Provider) -> list[DailyWeather]:
    if end < start:
        raise ApiError("The last day can't be before the first.")
    if (end - start).days >= MAX_DAYS:
        raise ApiError("Pick a range of a year or less.")
    return await provider.daily(place_id, start, end)
