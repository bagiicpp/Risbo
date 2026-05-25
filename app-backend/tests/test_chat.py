import pytest
from bson import ObjectId
from auth import create_access_token
import main
from main import update_long_term_memory
# --- Helper Classes to Mock httpx.AsyncClient.stream ---
class MockResponse:
    def raise_for_status(self): pass
    async def aiter_lines(self):
        yield 'data: "Hello"\n'
        yield 'data: " World"\n'

class MockStreamContext:
    async def __aenter__(self): return MockResponse()
    async def __aexit__(self, *args): pass

class MockClientContext:
    def stream(self, *args, **kwargs): return MockStreamContext()
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass
# -------------------------------------------------------

@pytest.mark.asyncio
async def test_chat_stream_new_conversation(async_client, mocker):
    """Test chatting creates a new conversation and streams text."""
    token = create_access_token({"sub": "athlete@test.com", "role": "athlete"})
    
    # Mock DB lookups
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId(), "role": "athlete"})
    main.db.conversations.insert_one = mocker.AsyncMock()
    main.db.conversations.update_one = mocker.AsyncMock()
    
    # Mock the HTTPX call to AI backend
    mocker.patch("main.httpx.AsyncClient", return_value=MockClientContext())
    mocker.patch("main.BackgroundTasks.add_task")

    response = await async_client.post(
        "/chat", 
        json={"prompt": "How do I build muscle?"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

@pytest.mark.asyncio
async def test_kitchen_generate_recipe(async_client, mocker):
    """Test that the kitchen generator cleanly intercepts AI JSON output."""
    token = create_access_token({"sub": "athlete@test.com", "role": "athlete"})
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    # Mock the Pantry Fetch
    mock_cursor = mocker.Mock()
    mock_cursor.to_list = mocker.AsyncMock(return_value=[{"item_name": "Rice"}])
    main.db.pantry.find = mocker.Mock(return_value=mock_cursor)

    # Mock the HTTPX POST response to return fake JSON from AI
    mock_post_response = mocker.Mock()
    mock_post_response.raise_for_status = mocker.Mock()
    fake_ai_output_string = '{"title": "Rice Bowl", "macros": {"protein": 30, "carbs": 50, "calories": 400}}'
    mock_post_response.json = mocker.Mock(return_value={
        "response": fake_ai_output_string
    })

    # Override the __aenter__ of our mock client context to handle .post()
    class MockKitchenClientContext:
        async def post(self, *args, **kwargs): return mock_post_response
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass

    mocker.patch("main.httpx.AsyncClient", return_value=MockKitchenClientContext())

    response = await async_client.post(
        "/kitchen/generate",
        data={"target_protein": 30}, # Simulating FormData
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Rice Bowl"

@pytest.mark.asyncio
async def test_update_long_term_memory(mocker):
    # Mock DB
    main.db.conversations.find_one = mocker.AsyncMock(return_value={
        "_id": ObjectId(), 
        "messages": [{"role": "user", "content": "hurt knee"}],
        "context_summary": ""
    })
    main.db.conversations.update_one = mocker.AsyncMock()

    # Mock HTTPX response
    mock_post_response = mocker.Mock()
    mock_post_response.raise_for_status = mocker.Mock()
    mock_post_response.json = mocker.Mock(return_value={"summary": "User has hurt knee."})

    class MockSummaryClient:
        async def post(self, *args, **kwargs): return mock_post_response
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass

    mocker.patch("main.httpx.AsyncClient", return_value=MockSummaryClient())

    # Run background task
    await update_long_term_memory(str(ObjectId()), "http://fake-url")

    # Assert update fired
    main.db.conversations.update_one.assert_called_once()
    call_args = main.db.conversations.update_one.call_args[0][1]
    assert call_args["$set"]["context_summary"] == "User has hurt knee."