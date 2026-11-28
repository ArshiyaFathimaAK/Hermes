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
    # Hotels and prices for UC-06 lodging. A sandbox key (sand_...) gives test prices.
    liteapi_api_key: str = ""

    # Generate AI Itinerary. Without a key, plans come from simple rules instead.
    openai_api_key: str = ""
    # Any chat model your key can use that supports JSON schema answers. A fast, cheap one is best.
    openai_model: str = "gpt-6.2-astra"
    openai_base_url: str = "https://api.openai.com/v1"
    # Under the app's 10-second wait, so a slow AI falls back to the rules before the app gives up.
    openai_timeout: float = 8.0
    # Optional, for reasoning models: "low" answers faster. Leave empty for models without it.
    openai_reasoning_effort: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
