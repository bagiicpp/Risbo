import pytest
from bson import ObjectId
from auth import create_access_token, get_password_hash
import main
import io
from fastapi import UploadFile

# Helper to quickly generate tokens for testing
def get_token(email="athlete@test.com", role="athlete"):
    return create_access_token({"sub": email, "role": role})

@pytest.mark.asyncio
async def test_ping(async_client):
    response = await async_client.get("/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "app-backend"}

# --- AUTHENTICATION TESTS ---

@pytest.mark.asyncio
async def test_register_user_success(async_client, mocker):
    main.db.users.find_one = mocker.AsyncMock(return_value=None)
    main.db.users.insert_one = mocker.AsyncMock()
    main.db.pending_users.find_one = mocker.AsyncMock(return_value=None)
    
    # Mock update_one instead of insert_one
    main.db.pending_users.update_one = mocker.AsyncMock()
    
    mocker.patch("main.smtplib.SMTP_SSL") 

    response = await async_client.post("/register", json={
        "email": "newathlete@test.com",
        "password": "strongpassword123",
        "name": "John Doe",
        "role": "athlete"
    })

    assert response.status_code == 201
    
    # Updated to match main.py return payload
    assert response.json()["message"] == "Verification code generated" 
    
    # Assert on update_one
    main.db.pending_users.update_one.assert_called_once()

@pytest.mark.asyncio
async def test_login_success(async_client, mocker):
    fake_hash = get_password_hash("password123")
    main.db.users.find_one = mocker.AsyncMock(return_value={
        "_id": ObjectId(),
        "email": "user@test.com",
        "hashed_password": fake_hash,
        "role": "athlete"
    })

    response = await async_client.post("/login", data={
        "username": "user@test.com",
        "password": "password123"
    })

    assert response.status_code == 200
    assert "access_token" in response.json()

# --- CHAT MANAGEMENT TESTS ---

@pytest.mark.asyncio
async def test_rename_conversation(async_client, mocker):
    token = get_token()
    conv_id = str(ObjectId())
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    # Mock update result
    mock_update_result = mocker.Mock()
    mock_update_result.matched_count = 1
    main.db.conversations.update_one = mocker.AsyncMock(return_value=mock_update_result)

    response = await async_client.patch(
        f"/conversations/{conv_id}", 
        json={"title": "New Title"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["title"] == "New Title"

@pytest.mark.asyncio
async def test_delete_conversation(async_client, mocker):
    token = get_token()
    conv_id = str(ObjectId())
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    mock_delete_result = mocker.Mock()
    mock_delete_result.deleted_count = 1
    main.db.conversations.delete_one = mocker.AsyncMock(return_value=mock_delete_result)
    main.db.metrics.delete_many = mocker.AsyncMock()

    response = await async_client.delete(
        f"/conversations/{conv_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    main.db.metrics.delete_many.assert_called_once()

# --- COACH & ROSTER TESTS ---

@pytest.mark.asyncio
async def test_coach_invite_athlete(async_client, mocker):
    token = get_token(role="coach")
    
    # Mock finding the coach, then the athlete
    main.db.users.find_one = mocker.AsyncMock(side_effect=[
        {"_id": ObjectId(), "email": "coach@test.com", "role": "coach"}, # The coach
        {"_id": ObjectId(), "email": "athlete@test.com", "role": "athlete"} # The athlete
    ])
    
    main.db.roster_links.find_one = mocker.AsyncMock(return_value=None)
    main.db.roster_links.insert_one = mocker.AsyncMock()

    response = await async_client.post(
        "/roster/invite",
        json={"email": "athlete@test.com"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert "Waiting for athlete approval" in response.json()["message"]

@pytest.mark.asyncio
async def test_athlete_respond_invite(async_client, mocker):
    token = get_token(role="athlete")
    coach_id = str(ObjectId())
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    main.db.roster_links.find_one = mocker.AsyncMock(return_value={"_id": ObjectId(), "status": "pending"})
    main.db.roster_links.update_one = mocker.AsyncMock()

    response = await async_client.post(
        f"/athlete/invites/{coach_id}/respond",
        json={"action": "accept"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    main.db.roster_links.update_one.assert_called_once()

# --- KITCHEN PANTRY TESTS ---

@pytest.mark.asyncio
async def test_kitchen_add_pantry_item(async_client, mocker):
    token = get_token()
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    main.db.pantry.update_one = mocker.AsyncMock()

    response = await async_client.post(
        "/kitchen/pantry",
        json={"item_name": "Olive Oil", "quantity": "1 bottle"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    main.db.pantry.update_one.assert_called_once()

@pytest.mark.asyncio
async def test_upload_file(async_client, mocker):
    token = get_token()
    conv_id = str(ObjectId())
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    main.db.conversations.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    main.db.conversations.update_one = mocker.AsyncMock()
    
    # Mock the text extraction utility
    mocker.patch("main.extract_text_from_file", new_callable=mocker.AsyncMock, return_value="Extracted text from PDF.")

    # Create a dummy file
    fake_file = io.BytesIO(b"dummy pdf content")
    fake_file.name = "workout.pdf"

    response = await async_client.post(
        f"/upload/{conv_id}",
        files={"file": ("workout.pdf", fake_file, "application/pdf")},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert "filename" in response.json()
    main.db.conversations.update_one.assert_called_once()

@pytest.mark.asyncio
async def test_get_profile_metrics(async_client, mocker):
    token = get_token()
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    mock_cursor = mocker.Mock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.to_list = mocker.AsyncMock(return_value=[
        {"metric_name": "weight", "value": 80, "date": "2024-01-01T00:00:00"}
    ])
    main.db.metrics.find = mocker.Mock(return_value=mock_cursor)

    response = await async_client.get(
        "/profile/metrics/weight",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["value"] == 80


# --- COACH DASHBOARD TESTS ---

@pytest.mark.asyncio
async def test_coach_metrics_summary(async_client, mocker):
    token = get_token(role="coach")
    coach_id = ObjectId()
    athlete_id = str(ObjectId())
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": coach_id})
    
    # Mock roster links
    mock_links_cursor = mocker.Mock()
    mock_links_cursor.to_list = mocker.AsyncMock(return_value=[{"athlete_id": athlete_id}])
    main.db.roster_links.find = mocker.Mock(return_value=mock_links_cursor)
    
    # Mock metrics aggregation
    mock_agg_cursor = mocker.Mock()
    mock_agg_cursor.to_list = mocker.AsyncMock(return_value=[
        {
            "_id": {"user_id": athlete_id, "metric_name": "weight"},
            "latest_value": 85,
            "unit": "kg",
            "date": "2024-01-01T00:00:00"
        }
    ])
    main.db.metrics.aggregate = mocker.Mock(return_value=mock_agg_cursor)
    
    # Mock fetching athlete names
    mock_athletes_cursor = mocker.Mock()
    mock_athletes_cursor.to_list = mocker.AsyncMock(return_value=[{"_id": ObjectId(athlete_id), "name": "John"}])
    main.db.users.find = mocker.Mock(return_value=mock_athletes_cursor)

    response = await async_client.get(
        "/coach/metrics/summary",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "John"
    assert "weight" in data[0]["metrics"]


# --- REMAINING PANTRY TESTS ---

@pytest.mark.asyncio
async def test_kitchen_get_pantry(async_client, mocker):
    token = get_token()
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    mock_cursor = mocker.Mock()
    mock_cursor.to_list = mocker.AsyncMock(return_value=[
        {"_id": ObjectId(), "item_name": "Rice", "quantity": "1 bag"}
    ])
    main.db.pantry.find = mocker.Mock(return_value=mock_cursor)

    response = await async_client.get(
        "/kitchen/pantry",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()[0]["item_name"] == "Rice"

@pytest.mark.asyncio
async def test_kitchen_delete_pantry_item(async_client, mocker):
    token = get_token()
    item_id = str(ObjectId())
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    mock_delete = mocker.Mock()
    mock_delete.deleted_count = 1
    main.db.pantry.delete_one = mocker.AsyncMock(return_value=mock_delete)

    response = await async_client.delete(
        f"/kitchen/pantry/{item_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    main.db.pantry.delete_one.assert_called_once()

# --- REMAINING CHAT FETCH TESTS ---

@pytest.mark.asyncio
async def test_get_conversations_list(async_client, mocker):
    token = get_token()
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    # Mock the cursor chain for .find().sort().to_list()
    mock_cursor = mocker.Mock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.to_list = mocker.AsyncMock(return_value=[
        {"_id": ObjectId(), "title": "Hypertrophy Chat", "created_at": "2024-01-01T00:00:00"}
    ])
    main.db.conversations.find = mocker.Mock(return_value=mock_cursor)

    response = await async_client.get(
        "/conversations",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Hypertrophy Chat"

@pytest.mark.asyncio
async def test_get_single_conversation(async_client, mocker):
    token = get_token()
    conv_id = str(ObjectId())
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    main.db.conversations.find_one = mocker.AsyncMock(return_value={
        "_id": ObjectId(conv_id),
        "title": "Specific Chat",
        "messages": [{"role": "user", "content": "Hello Risbo"}]
    })

    response = await async_client.get(
        f"/conversations/{conv_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Specific Chat"

# --- REMAINING ROSTER & CONSENT TESTS ---

@pytest.mark.asyncio
async def test_get_roster_athletes(async_client, mocker):
    token = get_token(role="coach")
    athlete_id = ObjectId()
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    # Mock links
    mock_links_cursor = mocker.Mock()
    mock_links_cursor.to_list = mocker.AsyncMock(return_value=[
        {"athlete_id": str(athlete_id), "status": "active"}
    ])
    main.db.roster_links.find = mocker.Mock(return_value=mock_links_cursor)
    
    # Mock athletes lookup
    mock_athletes_cursor = mocker.Mock()
    mock_athletes_cursor.to_list = mocker.AsyncMock(return_value=[
        {"_id": athlete_id, "name": "Athlete John", "email": "john@test.com"}
    ])
    main.db.users.find = mocker.Mock(return_value=mock_athletes_cursor)

    response = await async_client.get(
        "/roster/athletes",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()[0]["name"] == "Athlete John"
    assert response.json()[0]["status"] == "active"

@pytest.mark.asyncio
async def test_get_athlete_invites(async_client, mocker):
    token = get_token(role="athlete")
    coach_id = ObjectId()
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    # Mock pending links
    mock_links_cursor = mocker.Mock()
    mock_links_cursor.to_list = mocker.AsyncMock(return_value=[
        {"coach_id": str(coach_id), "status": "pending"}
    ])
    main.db.roster_links.find = mocker.Mock(return_value=mock_links_cursor)
    
    # Mock coaches lookup
    mock_coaches_cursor = mocker.Mock()
    mock_coaches_cursor.to_list = mocker.AsyncMock(return_value=[
        {"_id": coach_id, "name": "Coach Mike"}
    ])
    main.db.users.find = mocker.Mock(return_value=mock_coaches_cursor)

    response = await async_client.get(
        "/athlete/invites",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()[0]["name"] == "Coach Mike"

@pytest.mark.asyncio
async def test_coach_get_specific_athlete_metrics(async_client, mocker):
    token = get_token(role="coach")
    athlete_id = str(ObjectId())
    
    main.db.users.find_one = mocker.AsyncMock(return_value={"_id": ObjectId()})
    
    # 1. Mock security check (ensure link is active)
    main.db.roster_links.find_one = mocker.AsyncMock(return_value={"status": "active"})
    
    # 2. Mock time-series data
    mock_metrics_cursor = mocker.Mock()
    mock_metrics_cursor.sort.return_value = mock_metrics_cursor
    mock_metrics_cursor.to_list = mocker.AsyncMock(return_value=[
        {"metric_name": "sleep_hours", "value": 8, "date": "2024-01-01T00:00:00"}
    ])
    main.db.metrics.find = mocker.Mock(return_value=mock_metrics_cursor)

    response = await async_client.get(
        f"/coach/metrics/{athlete_id}?metric_name=sleep_hours",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["value"] == 8