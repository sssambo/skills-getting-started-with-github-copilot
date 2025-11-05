import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Known activity from the in-memory fixture
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "pytest_temp_user@example.com"

    # Ensure a clean start for this test
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    body = res.json()
    assert "Signed up" in body.get("message", "")

    # Verify participant added
    res = client.get("/activities")
    assert res.status_code == 200
    assert email in res.json()[activity]["participants"]

    # Remove participant
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    body = res.json()
    assert "Removed" in body.get("message", "")

    # Verify participant removed
    res = client.get("/activities")
    assert res.status_code == 200
    assert email not in res.json()[activity]["participants"]


def test_remove_nonexistent_participant():
    activity = "Chess Club"
    email = "nonexistent_123@example.com"

    # Make sure it's not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 404
    body = res.json()
    assert body.get("detail") is not None
