"""Auth endpoint tests — register, login, token validation."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/auth/register", json={
        "email": "newuser@test.com",
        "password": "NewUser1234!",
        "name": "New User",
        "role": "influencer",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "newuser@test.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@test.com", "password": "Dup1234!", "name": "Dup", "role": "influencer"}
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "login@test.com",
        "password": "Login1234!",
        "name": "Login User",
        "role": "influencer",
    })
    resp = await client.post("/auth/login", json={"email": "login@test.com", "password": "Login1234!"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "wrongpw@test.com",
        "password": "Correct1234!",
        "name": "Wrong PW",
        "role": "influencer",
    })
    resp = await client.post("/auth/login", json={"email": "wrongpw@test.com", "password": "WrongPassword!"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    resp = await client.get("/auth/me")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_me_with_valid_token(client: AsyncClient, influencer_token: str):
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {influencer_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "role" in data
