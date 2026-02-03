"""
Source Management API Routes.

This module provides REST API endpoints for managing geospatial data sources.
Sources represent the raw data that can be visualized on the map, including:
- PostGIS tables
- GeoJSON files
- Shapefiles
- Cloud Optimized GeoTIFFs (COGs)
- External WMS/WFS services
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.users import current_active_user
from app.models import Source, User
from app.schemas import SourceCreate, SourceUpdate, SourceSchema, PaginatedResponse

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


@router.get(
    "/",
    response_model=PaginatedResponse[SourceSchema],
    summary="List All Sources",
    description="""
    Retrieve a paginated list of all geospatial data sources.

    Returns sources sorted by creation date (newest first).

    **Authentication**: Not required (public read access)

    **Rate Limit**: 100 requests/minute for anonymous users
    """,
    responses={
        200: {
            "description": "Successful response with list of sources",
            "content": {
                "application/json": {
                    "example": {
                        "count": 25,
                        "next": "/api/v1/sources/?page=2",
                        "previous": None,
                        "results": [
                            {
                                "id": 1,
                                "sid": "my-dataset",
                                "name": "My Geospatial Dataset",
                                "description": "A sample dataset for testing",
                                "source_type": "postgis",
                                "attributes": {"geometry_column": "geom"},
                                "created_at": "2024-01-15T10:30:00Z",
                                "updated_at": "2024-01-20T14:45:00Z",
                            }
                        ],
                    }
                }
            },
        },
    },
)
async def list_sources(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: Annotated[int, Query(ge=1, description="Page number (1-indexed)")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page (max: 100)")] = 25,
) -> PaginatedResponse[SourceSchema]:
    """
    List all available geospatial data sources with pagination.

    Args:
        db: Database session
        page: Page number for pagination (default: 1)
        page_size: Number of items per page (default: 25, max: 100)

    Returns:
        Paginated list of sources with count and navigation links
    """
    offset = (page - 1) * page_size

    count_stmt = select(func.count()).select_from(Source)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()

    stmt = select(Source).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    sources = result.scalars().all()

    # Build pagination URLs
    next_url = None
    previous_url = None

    if offset + page_size < total:
        next_url = f"/api/v1/sources/?page={page + 1}&page_size={page_size}"
    if page > 1:
        previous_url = f"/api/v1/sources/?page={page - 1}&page_size={page_size}"

    return {
        "count": total,
        "next": next_url,
        "previous": previous_url,
        "results": sources,
    }


@router.post(
    "/",
    response_model=SourceSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Source",
    description="""
    Create a new geospatial data source.

    The source will be associated with the authenticated user (owner).

    **Authentication**: Required (JWT or OAuth2)

    **Rate Limit**: 1000 requests/minute for authenticated users
    """,
    responses={
        201: {
            "description": "Source created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 26,
                        "sid": "new-dataset",
                        "name": "New Dataset",
                        "description": "Created via API",
                        "source_type": "geojson",
                        "attributes": {"url": "https://example.com/data.geojson"},
                        "created_at": "2024-01-25T09:00:00Z",
                        "updated_at": None,
                    }
                }
            },
        },
        400: {"description": "Invalid input data"},
        401: {"description": "Authentication required"},
    },
)
async def create_source(
    payload: SourceCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(current_active_user)],
) -> SourceSchema:
    """
    Create a new geospatial data source.

    Args:
        payload: Source creation data
        db: Database session
        user: Authenticated user (becomes owner)

    Returns:
        Created source with generated ID and timestamps
    """
    source = Source(**payload.model_dump(), owner_id=user.id)
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


@router.get(
    "/{source_id}/",
    response_model=SourceSchema,
    summary="Get Source Details",
    description="""
    Retrieve detailed information about a specific geospatial data source.

    **Authentication**: Not required (public read access)

    **Rate Limit**: 100 requests/minute for anonymous users
    """,
    responses={
        200: {"description": "Source details retrieved successfully"},
        404: {"description": "Source not found"},
    },
)
async def get_source(
    source_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SourceSchema:
    """
    Get details of a specific source by ID.

    Args:
        source_id: Unique source identifier
        db: Database session

    Returns:
        Source details

    Raises:
        HTTPException 404: If source doesn't exist
    """
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source with ID {source_id} not found",
        )
    return source


@router.put(
    "/{source_id}/",
    response_model=SourceSchema,
    summary="Update Source",
    description="""
    Update an existing geospatial data source.

    Replaces all mutable fields. Use PATCH for partial updates.

    **Authentication**: Required (owner or admin only)

    **Rate Limit**: 1000 requests/minute for authenticated users
    """,
    responses={
        200: {"description": "Source updated successfully"},
        403: {"description": "Permission denied"},
        404: {"description": "Source not found"},
    },
)
async def update_source(
    source_id: int,
    payload: SourceCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(current_active_user)],
) -> SourceSchema:
    """
    Update an existing source (full replacement).

    Args:
        source_id: Source to update
        payload: Updated source data
        db: Database session
        user: Authenticated user

    Returns:
        Updated source

    Raises:
        HTTPException 404: If source doesn't exist
        HTTPException 403: If not the owner
    """
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source with ID {source_id} not found",
        )

    # Check ownership (simplified - in production, use proper permission checks)
    if hasattr(source, "owner_id") and source.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this source",
        )

    for key, value in payload.model_dump().items():
        setattr(source, key, value)
    await db.commit()
    await db.refresh(source)
    return source


@router.patch(
    "/{source_id}/",
    response_model=SourceSchema,
    summary="Partial Update Source",
    description="""
    Partially update an existing geospatial data source.

    Only provided fields will be updated. Other fields remain unchanged.

    **Authentication**: Required (owner or admin only)

    **Rate Limit**: 1000 requests/minute for authenticated users
    """,
    responses={
        200: {"description": "Source updated successfully"},
        403: {"description": "Permission denied"},
        404: {"description": "Source not found"},
    },
)
async def partial_update_source(
    source_id: int,
    payload: SourceUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(current_active_user)],
) -> SourceSchema:
    """
    Partially update a source (only provided fields).

    Args:
        source_id: Source to update
        payload: Fields to update
        db: Database session
        user: Authenticated user

    Returns:
        Updated source

    Raises:
        HTTPException 404: If source doesn't exist
        HTTPException 403: If not the owner
    """
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source with ID {source_id} not found",
        )

    # Check ownership
    if hasattr(source, "owner_id") and source.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this source",
        )

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(source, key, value)
    await db.commit()
    await db.refresh(source)
    return source


@router.delete(
    "/{source_id}/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Source",
    description="""
    Delete a geospatial data source.

    This action is permanent and cannot be undone. All associated layers
    will also be affected.

    **Authentication**: Required (owner or admin only)

    **Rate Limit**: 100 requests/minute for authenticated users
    """,
    responses={
        204: {"description": "Source deleted successfully"},
        403: {"description": "Permission denied"},
        404: {"description": "Source not found"},
    },
)
async def delete_source(
    source_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(current_active_user)],
) -> None:
    """
    Delete a source permanently.

    Args:
        source_id: Source to delete
        db: Database session
        user: Authenticated user

    Raises:
        HTTPException 404: If source doesn't exist
        HTTPException 403: If not the owner
    """
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source with ID {source_id} not found",
        )

    # Check ownership
    if hasattr(source, "owner_id") and source.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this source",
        )

    await db.delete(source)
    await db.commit()
