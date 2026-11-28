import pytest
from fastapi.testclient import TestClient

from hermes_api.config import Settings, get_settings
from hermes_api.features.places.provider import get_place_provider
from hermes_api.features.weather.mock import MockWeatherProvider
from hermes_api.features.weather.provider import get_weather_provider
from hermes_api.main import create_app

# Providers chosen once per server (cached), cleared so each test picks again without keys.
CACHED_PROVIDERS = [get_place_provider]


@pytest.fixture(autouse=True)
def no_keys(monkeypatch):
    """Tests never use real keys, even when server/.env has them: no network, no quota spent."""
    for name in Settings.model_fields:
        if name.endswith("_api_key"):
            monkeypatch.setenv(name.upper(), "")
    get_settings.cache_clear()
    for provider in CACHED_PROVIDERS:
        provider.cache_clear()
    yield
    get_settings.cache_clear()
    for provider in CACHED_PROVIDERS:
        provider.cache_clear()


@pytest.fixture
def app():
    app = create_app()
    # Weather is live with no API key to fall back from, so tests pin it to the sample data.
    app.dependency_overrides[get_weather_provider] = MockWeatherProvider
    return app


@pytest.fixture
def client(app):
    """Talks to the server in memory, on the mock providers. No network, no keys."""
    return TestClient(app)
