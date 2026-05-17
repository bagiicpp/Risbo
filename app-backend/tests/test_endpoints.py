import pytest
from auth import create_access_token
from bson import ObjectId

@pytest.mark.asyncio
async def test_register_user_success(async_client, mocker):
    """Test that a new user can register successfully."""
    # Tell the mock to be async so it can be awaited!
    mocker.patch("main.db.users.find_one", new_callable=mocker.AsyncMock, return_value=None)
    mock_insert = mocker.patch("main.db.users.insert_one", new_callable=mocker.AsyncMock)

    response = await async_client.post("/register", json={
        "email": "newathlete@test.com",
        "password": "strongpassword123"
    })

    assert response.status_code == 201
    assert response.json() == {"message": "User registered successfully"}
    mock_insert.assert_called_once()

@pytest.mark.asyncio
async def test_get_conversations(async_client, mocker):
    """Test fetching the history for a logged-in user."""
    token = create_access_token({"sub": "athlete@test.com"})
    fake_user_id = ObjectId()
    
    # Async mock for user lookup
    mocker.patch("main.db.users.find_one", new_callable=mocker.AsyncMock, return_value={"_id": fake_user_id, "email": "athlete@test.com"})
    
    # The cursor chain: .find() is synchronous, but .to_list() is async!
    mock_cursor = mocker.Mock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.to_list = mocker.AsyncMock(return_value=[
        {"_id": ObjectId(), "user_id": str(fake_user_id), "title": "Hypertrophy Chat"}
    ])
    mocker.patch("main.db.conversations.find", return_value=mock_cursor)

    response = await async_client.get(
        "/conversations", 
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Hypertrophy Chat"