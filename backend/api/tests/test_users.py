import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_user_profile_requires_auth(client: AsyncClient):
    """Test that getting user profile without auth returns 401."""
    response = await client.get("/api/v1/user-profile/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_user_profile_requires_auth(client: AsyncClient):
    """Test that updating user profile without auth returns 401."""
    response = await client.put(
        "/api/v1/user-profile/",
        json={"name": "Updated Name"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_partial_update_user_profile_requires_auth(client: AsyncClient):
    """Test that partial updating user profile without auth returns 401."""
    response = await client.patch(
        "/api/v1/user-profile/",
        json={"name": "Updated Name"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_user_profile_endpoint_exists(client: AsyncClient):
    """Test that user profile endpoint exists and rejects unauthenticated requests."""
    response = await client.get("/api/v1/user-profile/")
    assert response.status_code == 401
