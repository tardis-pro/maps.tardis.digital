import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_projects_empty(client: AsyncClient):
    """Test listing projects when database is empty."""
    response = await client.get("/api/v1/projects/")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "count" in data
    assert data["count"] == 0


@pytest.mark.asyncio
async def test_list_projects_with_pagination(client: AsyncClient):
    """Test listing projects with pagination parameters."""
    response = await client.get("/api/v1/projects/?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "count" in data


@pytest.mark.asyncio
async def test_get_project_not_found(client: AsyncClient):
    """Test getting a non-existent project returns 404."""
    response = await client.get("/api/v1/projects/99999/")
    assert response.status_code == 404
    assert "Project not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_project_requires_auth(client: AsyncClient):
    """Test that creating a project without auth returns 401."""
    response = await client.post(
        "/api/v1/projects/",
        json={"pid": "test-project", "name": "Test", "project_type": "default"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_projects_returns_empty_list_initially(client: AsyncClient):
    """Verify that listing projects on fresh DB returns empty list."""
    response = await client.get("/api/v1/projects/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert data["results"] == []


@pytest.mark.asyncio
async def test_project_list_pagination_next_previous_fields(client: AsyncClient):
    """Test that pagination response includes next and previous fields."""
    response = await client.get("/api/v1/projects/?page=2&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "next" in data
    assert "previous" in data
    assert "count" in data
    assert "results" in data
