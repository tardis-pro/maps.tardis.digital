from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.users import current_active_user
from app.core.rate_limit import limiter, RateLimits
from app.models import Layer, Source, User
from app.schemas import LayerCreate, LayerUpdate, LayerSchema, PaginatedResponse

router = APIRouter(prefix="/api/v1/layers", tags=["layers"])


@router.get("/", response_model=PaginatedResponse[LayerSchema])
@limiter.limit(RateLimits.READ_ONLY)
async def list_layers(
    request: Request,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    offset = (page - 1) * page_size
    count_stmt = select(func.count()).select_from(Layer)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()

    stmt = select(Layer).options(selectinload(Layer.source)).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    layers = result.scalars().all()
    return {"count": total, "next": None, "previous": None, "results": layers}


@router.post("/", response_model=LayerSchema, status_code=201)
@limiter.limit(RateLimits.WRITE)
async def create_layer(
    request: Request,
    payload: LayerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = await db.get(Source, payload.source_id)
    if not source:
        raise HTTPException(status_code=400, detail="Source not found")
    layer = Layer(**payload.model_dump())
    db.add(layer)
    await db.commit()
    await db.refresh(layer)
    return layer


@router.get("/{layer_id}/", response_model=LayerSchema)
@limiter.limit(RateLimits.READ_ONLY)
async def get_layer(request: Request, layer_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Layer).options(selectinload(Layer.source)).where(Layer.id == layer_id)
    result = await db.execute(stmt)
    layer = result.scalar_one_or_none()
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    return layer


@router.put("/{layer_id}/", response_model=LayerSchema)
@limiter.limit(RateLimits.WRITE)
async def update_layer(
    request: Request,
    layer_id: int,
    payload: LayerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    layer = await db.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    for key, value in payload.model_dump().items():
        setattr(layer, key, value)
    await db.commit()
    await db.refresh(layer)
    return layer


@router.patch("/{layer_id}/", response_model=LayerSchema)
@limiter.limit(RateLimits.WRITE)
async def partial_update_layer(
    request: Request,
    layer_id: int,
    payload: LayerUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    layer = await db.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(layer, key, value)
    await db.commit()
    await db.refresh(layer)
    return layer


@router.delete("/{layer_id}/", status_code=204)
@limiter.limit(RateLimits.WRITE)
async def delete_layer(
    request: Request,
    layer_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    layer = await db.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    await db.delete(layer)
    await db.commit()
