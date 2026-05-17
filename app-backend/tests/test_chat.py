import pytest
from auth import create_access_token
from bson import ObjectId

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
    """Test chatting without an ID creates a new conversation and streams text."""
    
    token = create_access_token({"sub": "athlete@test.com"})
    
    # Fix: Async mock for the database lookups and inserts
    mocker.patch("main.db.users.find_one", new_callable=mocker.AsyncMock, return_value={"_id": ObjectId()})
    mock_insert = mocker.patch("main.db.conversations.insert_one", new_callable=mocker.AsyncMock)
    
    mocker.patch("main.httpx.AsyncClient", return_value=MockClientContext())
    mocker.patch("main.BackgroundTasks.add_task")

    response = await async_client.post(
        "/chat", 
        json={"prompt": "How do I build muscle?"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    
    chunks = [chunk async for chunk in response.aiter_bytes()]
    stream_output = b"".join(chunks).decode("utf-8")
    
    assert 'data: "Hello"\n' in stream_output
    assert 'data: " World"\n' in stream_output
    
    mock_insert.assert_called_once()