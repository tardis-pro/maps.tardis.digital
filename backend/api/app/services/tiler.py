"""
Hybrid Tiling Service.

This module implements a smart tiling strategy that automatically selects between
Vector Tiles (MVT) and Raster Tiles (COG) based on dataset size.

Performance thresholds:
- Small datasets (< 10k features): Vector tiles (MVT) - fast, interactive
- Medium datasets (10k - 100k features): Hybrid approach with clustering
- Large datasets (> 100k features): Raster tiles (COG) - server-side rendering
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Source

logger = logging.getLogger(__name__)


class TileFormat(str, Enum):
    """Supported tile formats."""
    MVT = "mvt"  # Mapbox Vector Tile
    COG = "cog"  # Cloud Optimized GeoTIFF
    RASTER = "raster"  # PNG/JPEG raster


class RenderStrategy(str, Enum):
    """Automatic rendering strategy selection."""
    VECTOR = "vector"  # Use MVT for small datasets
    HYBRID = "hybrid"  # Mixed with clustering for medium datasets
    RASTER = "raster"  # Use COG for large datasets


@dataclass
class TilingConfig:
    """Configuration for hybrid tiling strategy."""
    # Feature count thresholds
    VECTOR_THRESHOLD: int = 10_000  # Below this, use vector tiles
    RASTER_THRESHOLD: int = 100_000  # Above this, use raster tiles

    # Tile server endpoints
    VECTOR_TILER_URL: str = "http://martin:3000"
    RASTER_TILER_URL: str = "http://titiler:9000"

    # Tile size limits
    MAX_VECTOR_TILE_FEATURES: int = 50_000  # Per-tile feature limit


class HybridTilingService:
    """
    Service that intelligently selects between vector and raster tiles.

    The strategy is determined by:
    1. Total feature count in the dataset
    2. Current zoom level
    3. Viewport extent
    """

    def __init__(self, config: Optional[TilingConfig] = None):
        self.config = config or TilingConfig()

    async def get_source_feature_count(
        self,
        db: AsyncSession,
        source_id: int,
    ) -> int:
        """Get the total number of features in a source."""
        # For PostGIS sources, count rows in the table
        # For file-based sources, count features in the file
        stmt = select(func.count()).select_from(Source).where(Source.id == source_id)
        result = await db.execute(stmt)
        return result.scalar() or 0

    def determine_strategy(
        self,
        feature_count: int,
        zoom_level: int,
        viewport_features: int,
    ) -> RenderStrategy:
        """
        Determine the optimal rendering strategy.

        Args:
            feature_count: Total features in the dataset
            zoom_level: Current map zoom level (0-22)
            viewport_features: Estimated features in current viewport

        Returns:
            Recommended render strategy
        """
        # Small datasets always use vector tiles
        if feature_count < self.config.VECTOR_THRESHOLD:
            return RenderStrategy.VECTOR

        # Large datasets always use raster tiles
        if feature_count > self.config.RASTER_THRESHOLD:
            return RenderStrategy.RASTER

        # Medium datasets: decide based on zoom and viewport
        # Low zoom (continent/country view): fewer details, can use vector with aggregation
        # High zoom (city/street view): more details, might need raster
        if zoom_level <= 6:
            # Continent/country level - vector with clustering
            return RenderStrategy.HYBRID
        elif zoom_level >= 15:
            # Street level - too many details, switch to raster
            return RenderStrategy.RASTER
        else:
            # City/neighborhood level - vector with clustering
            return RenderStrategy.HYBRID

    def get_tile_url(
        self,
        strategy: RenderStrategy,
        source_id: int,
        z: int,
        x: int,
        y: int,
    ) -> str:
        """
        Generate the appropriate tile URL based on strategy.

        Args:
            strategy: Selected render strategy
            source_id: Source identifier
            z: Zoom level
            x: Tile X coordinate
            y: Tile Y coordinate

        Returns:
            URL to fetch the tile from
        """
        if strategy == RenderStrategy.RASTER:
            # COG tiles from titiler
            return (
                f"{self.config.RASTER_TILER_URL}/tiles/{z}/{x}/{y}"
                f"?url=postgresql://..."  # Would be configured per source
            )
        else:
            # MVT tiles from martin
            return (
                f"{self.config.VECTOR_TILER_URL}/tile"
                f"?source={source_id}&z={z}&x={x}&y={y}"
            )

    async def get_tile_info(
        self,
        db: AsyncSession,
        source_id: int,
    ) -> dict:
        """
        Get tiling information for a source.

        Returns metadata about recommended tile format and strategy.
        """
        feature_count = await self.get_source_feature_count(db, source_id)

        strategy = self.determine_strategy(
            feature_count=feature_count,
            zoom_level=10,  # Default zoom for metadata
            viewport_features=feature_count,
        )

        return {
            "source_id": source_id,
            "feature_count": feature_count,
            "recommended_strategy": strategy.value,
            "tile_format": TileFormat.MVT.value if strategy != RenderStrategy.RASTER else TileFormat.COG.value,
            "threshold_vector": self.config.VECTOR_THRESHOLD,
            "threshold_raster": self.config.RASTER_THRESHOLD,
            "tile_urls": {
                "vector": self.get_tile_url(RenderStrategy.VECTOR, source_id, 10, 0, 0),
                "raster": self.get_tile_url(RenderStrategy.RASTER, source_id, 10, 0, 0),
            },
        }


# Router for tile-related endpoints
router = APIRouter(prefix="/api/v1/tiles", tags=["tiles"])

# Service instance
tiling_service = HybridTilingService()


@router.get("/info/{source_id}")
async def get_tiling_info(
    source_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Get tiling information for a specific source.

    Returns the recommended tile format and strategy based on dataset size.

    Example Response:
    ```json
    {
        "source_id": 1,
        "feature_count": 150000,
        "recommended_strategy": "raster",
        "tile_format": "cog",
        "threshold_vector": 10000,
        "threshold_raster": 100000,
        "tile_urls": {
            "vector": "http://martin:3000/tile?source=1&z=10&x=0&y=0",
            "raster": "http://titiler:9000/tiles/10/0/0?url=..."
        }
    }
    ```
    """
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source {source_id} not found",
        )

    return await tiling_service.get_tile_info(db, source_id)


@router.get("/strategy")
async def get_render_strategy(
    source_id: int,
    zoom: int = Query(ge=0, le=22, description="Current zoom level"),
    feature_count: Optional[int] = Query(None, description="Override feature count"),
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Calculate the optimal render strategy for given parameters.

    Use this endpoint when you need to dynamically determine the best
    rendering approach based on current viewport and zoom level.
    """
    if feature_count is None:
        feature_count = await tiling_service.get_source_feature_count(db, source_id)

    strategy = tiling_service.determine_strategy(
        feature_count=feature_count,
        zoom_level=zoom,
        viewport_features=feature_count,  # Simplified - would calculate actual viewport
    )

    return {
        "source_id": source_id,
        "zoom_level": zoom,
        "feature_count": feature_count,
        "strategy": strategy.value,
        "tile_format": TileFormat.MVT.value if strategy != RenderStrategy.RASTER else TileFormat.COG.value,
        "tile_url": tiling_service.get_tile_url(strategy, source_id, zoom, 0, 0),
    }


# Configuration response model
class TilingConfigResponse(BaseModel):
    """Response model for tiling configuration."""
    vector_threshold: int = Field(
        description="Feature count below which vector tiles are used"
    )
    raster_threshold: int = Field(
        description="Feature count above which raster tiles are used"
    )
    max_vector_tile_features: int = Field(
        description="Maximum features per vector tile"
    )
    vector_tiler_url: str = Field(
        description="URL for MVT tile server"
    )
    raster_tiler_url: str = Field(
        description="URL for COG tile server"
    )


@router.get("/config", response_model=TilingConfigResponse)
async def get_tiling_config() -> TilingConfigResponse:
    """
    Get the current tiling configuration.

    Returns thresholds and tile server URLs used by the hybrid strategy.
    """
    config = tiling_service.config
    return TilingConfigResponse(
        vector_threshold=config.VECTOR_THRESHOLD,
        raster_threshold=config.RASTER_THRESHOLD,
        max_vector_tile_features=config.MAX_VECTOR_TILE_FEATURES,
        vector_tiler_url=config.VECTOR_TILER_URL,
        raster_tiler_url=config.RASTER_TILER_URL,
    )
