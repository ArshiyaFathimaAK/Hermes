"""Builds the app. Each feature's router is listed once below."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .errors import add_error_handlers
from .features.activities.router import router as activities
from .features.costs.router import router as costs
from .features.places.router import router as places
from .features.stays.router import router as stays
from .features.weather.router import router as weather

FEATURE_ROUTERS = [places, activities, stays, weather, costs]


def create_app() -> FastAPI:
    app = FastAPI(
        title="Hermes API",
        summary="Live data about real places. Accounts and trips are in Supabase, not here.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    add_error_handlers(app)

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    for router in FEATURE_ROUTERS:
        app.include_router(router)
    return app


app = create_app()
