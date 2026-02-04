import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_geometries_empty(client: AsyncClient):
    """Test getting geometries when database is empty."""
    response = await client.get("/api/v1/wfs/")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data


@pytest.mark.asyncio
async def test_get_geometries_with_limit(client: AsyncClient):
    """Test getting geometries with limit parameter."""
    response = await client.get("/api/v1/wfs/?limit=100")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data


@pytest.mark.asyncio
async def test_get_geometries_with_bbox(client: AsyncClient):
    """Test getting geometries with bounding box filter."""
    response = await client.get("/api/v1/wfs/?bbox=-180,-90,180,90")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"


@pytest.mark.asyncio
async def test_get_geometries_with_source_id(client: AsyncClient):
    """Test getting geometries filtered by source_id."""
    response = await client.get("/api/v1/wfs/?source_id=1")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"


@pytest.mark.asyncio
async def test_get_geometries_with_bbox_and_source_id(client: AsyncClient):
    """Test getting geometries with both bbox and source_id."""
    response = await client.get("/api/v1/wfs/?bbox=-180,-90,180,90&source_id=1&limit=100")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"


@pytest.mark.asyncio
async def test_get_geometries_max_limit(client: AsyncClient):
    """Test getting geometries with maximum limit."""
    response = await client.get("/api/v1/wfs/?limit=10000")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"


@pytest.mark.asyncio
async def test_get_geometries_returns_valid_geojson(client: AsyncClient):
    """Test that returned geometry is valid GeoJSON."""
    response = await client.get("/api/v1/wfs/")
    assert response.status_code == 200
    data = response.json()
    # Validate structure
    assert data["type"] == "FeatureCollection"
    assert isinstance(data["features"], list)
