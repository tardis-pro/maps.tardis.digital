import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_layers_empty(client: AsyncClient):
    """Test listing layers when database is empty."""
    response = await client.get("/api/v1/layers/")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "count" in data
    assert data["count"] == 0


@pytest.mark.asyncio
async def test_list_layers_with_pagination(client: AsyncClient):
    """Test listing layers with pagination parameters."""
    response = await client.get("/api/v1/layers/?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "count" in data


@pytest.mark.asyncio
async def test_get_layer_not_found(client: AsyncClient):
    """Test getting a non-existent layer returns 404."""
    response = await client.get("/api/v1/layers/99999/")
    assert response.status_code == 404
    assert "Layer not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_layer_requires_auth(client: AsyncClient):
    """Test that creating a layer without auth returns 401."""
    response = await client.post(
        "/api/v1/layers/",
        json={"lid": "test-layer", "name": "Test Layer", "source_id": 1},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_layers_pagination_response_structure(client: AsyncClient):
    """Test that layer pagination response has correct structure."""
    response = await client.get("/api/v1/layers/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "results" in data
    assert "count" in data
    assert isinstance(data["results"], list)
