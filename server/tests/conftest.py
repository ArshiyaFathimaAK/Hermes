import pytest
from fastapi.testclient import TestClient

from hermes_api.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    """Talks to the server in memory, on the mock providers. No network, no keys."""
    return TestClient(app)
