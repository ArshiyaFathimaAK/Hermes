import pytest
from fastapi.testclient import TestClient

from hermes_api.features.weather.mock import MockWeatherProvider
from hermes_api.features.weather.provider import get_weather_provider
from hermes_api.main import create_app


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
