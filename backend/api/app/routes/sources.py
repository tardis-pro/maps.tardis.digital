from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.users import current_active_user
from app.models import Source, User
from app.schemas import SourceCreate, SourceUpdate, SourceSchema, PaginatedResponse

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


@router.get("/", response_model=PaginatedResponse[SourceSchema])
async def list_sources(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    offset = (page - 1) * page_size

    count_stmt = select(func.count()).select_from(Source)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()

    stmt = select(Source).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    sources = result.scalars().all()

    return {"count": total, "next": None, "previous": None, "results": sources}


@router.post("/", response_model=SourceSchema, status_code=201)
async def create_source(
    payload: SourceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = Source(**payload.model_dump())
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


@router.get("/{source_id}/", response_model=SourceSchema)
async def get_source(source_id: int, db: AsyncSession = Depends(get_db)):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.put("/{source_id}/", response_model=SourceSchema)
async def update_source(
    source_id: int,
    payload: SourceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    for key, value in payload.model_dump().items():
        setattr(source, key, value)
    await db.commit()
    await db.refresh(source)
    return source


@router.patch("/{source_id}/", response_model=SourceSchema)
async def partial_update_source(
    source_id: int,
    payload: SourceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(source, key, value)
    await db.commit()
    await db.refresh(source)
    return source


@router.delete("/{source_id}/", status_code=204)
async def delete_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.delete(source)
    await db.commit()
