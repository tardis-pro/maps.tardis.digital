import json
from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from geoalchemy2.functions import ST_AsGeoJSON, ST_Intersects, ST_MakeEnvelope
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limit import limiter, RateLimits
from app.models import Geometry

router = APIRouter(prefix="/api/v1/wfs", tags=["wfs"])


@router.get("/")
@limiter.limit(RateLimits.READ_ONLY)
async def get_geometries(
    request: Request,
    db: AsyncSession = Depends(get_db),
    bbox: str | None = Query(None, description="Bounding box: minx,miny,maxx,maxy"),
    source_id: int | None = Query(None),
    limit: int = Query(1000, ge=1, le=10000),
) -> dict[str, Any]:
    """Get geometries as GeoJSON FeatureCollection."""
    stmt = select(
        Geometry.gid,
        Geometry.metadata_,
        Geometry.geometry_type,
        Geometry.source_id,
        ST_AsGeoJSON(Geometry.geom).label("geojson"),
    )

    if bbox:
        coords = [float(c) for c in bbox.split(",")]
        if len(coords) == 4:
            minx, miny, maxx, maxy = coords
            envelope = ST_MakeEnvelope(minx, miny, maxx, maxy, 4326)
            stmt = stmt.where(ST_Intersects(Geometry.geom, envelope))

    if source_id:
        stmt = stmt.where(Geometry.source_id == source_id)

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    rows = result.all()

    features = []
    for row in rows:
        geom = json.loads(row.geojson)
        feature = {
            "type": "Feature",
            "id": row.gid,
            "geometry": geom,
            "properties": {
                **row.metadata_,
                "geometry_type": row.geometry_type,
                "source_id": row.source_id,
            },
        }
        features.append(feature)

    return {"type": "FeatureCollection", "features": features}
