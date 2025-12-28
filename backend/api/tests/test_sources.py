import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_sources_empty(client: AsyncClient):
    response = await client.get("/api/v1/sources/")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "count" in data


@pytest.mark.asyncio
async def test_create_source_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/v1/sources/",
        json={"sid": "test-source", "name": "Test Source", "source_type": "vector"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_source_not_found(client: AsyncClient):
    response = await client.get("/api/v1/sources/99999/")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
