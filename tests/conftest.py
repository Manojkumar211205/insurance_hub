import pytest
import mongomock
from unittest.mock import patch
from fastapi.testclient import TestClient
from hypothesis import settings

# Register Hypothesis profile with max_examples=10
settings.register_profile("ci", max_examples=10)
settings.load_profile("ci")


@pytest.fixture
def mongo_client():
    """Provide a mongomock MongoClient for tests."""
    return mongomock.MongoClient()


@pytest.fixture
def test_client(mongo_client):
    """Provide a FastAPI TestClient with MongoDB patched via mongomock."""
    db = mongo_client["insurance_mcp"]

    with patch("database.db.get_db", return_value=db), \
         patch("database.db.get_users_collection", return_value=db["users"]), \
         patch("database.db.get_insurance_collection", return_value=db["user_insurance"]):
        from main import app
        with TestClient(app) as client:
            yield client
