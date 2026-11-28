"""Settings, read from environment variables or server/.env. Never hard-code a key."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Web origins allowed to call the server (the Expo web dev server). Phones don't need this.
    cors_origins: list[str] = ["http://localhost:8081", "http://localhost:19006"]

    # How long to wait for an outside service before giving up, in seconds.
    outbound_timeout: float = 10.0

    # API keys for live providers. Add yours here AND to .env.example, never to code or the app.
    google_places_api_key: str = ""
    viator_api_key: str = ""
    booking_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
