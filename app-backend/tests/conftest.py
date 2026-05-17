import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Inject dummy environment variables for testing
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-ci-cd-pipeline"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017/rizzbo_test_db"
os.environ["AI_BACKEND_URL"] = "http://localhost:8000"

from main import app  # Import app AFTER setting env vars
import main           # Import main so we can manipulate its global variables

@pytest.fixture(autouse=True)
def mock_mongo_startup(mocker):
    """Prevents FastAPI from trying to connect to a real MongoDB during test startup."""
    mocker.patch("main.AsyncIOMotorClient")
    # FIX: Give the global db variable a dummy mock object so mocker.patch can traverse it!
    main.db = mocker.MagicMock()

@pytest_asyncio.fixture
async def async_client():
    """Provides a fake frontend client to send requests to our FastAPI routes."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac