from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.users import current_active_user
from app.models import Project, Layer, User
from app.schemas import ProjectCreate, ProjectUpdate, ProjectSchema, PaginatedResponse

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("/", response_model=PaginatedResponse[ProjectSchema])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    offset = (page - 1) * page_size
    count_stmt = select(func.count()).select_from(Project)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()

    stmt = (
        select(Project)
        .options(selectinload(Project.layers).selectinload(Layer.source))
        .offset(offset).limit(page_size)
    )
    result = await db.execute(stmt)
    projects = result.scalars().all()
    return {"count": total, "next": None, "previous": None, "results": projects}


@router.post("/", response_model=ProjectSchema, status_code=201)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    data = payload.model_dump(exclude={"layer_ids"})
    project = Project(**data)
    if payload.layer_ids:
        stmt = select(Layer).where(Layer.id.in_(payload.layer_ids))
        result = await db.execute(stmt)
        project.layers = list(result.scalars().all())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}/", response_model=ProjectSchema)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Project)
        .options(selectinload(Project.layers).selectinload(Layer.source))
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}/", response_model=ProjectSchema)
async def update_project(
    project_id: int,
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    data = payload.model_dump(exclude={"layer_ids"})
    for key, value in data.items():
        setattr(project, key, value)
    if payload.layer_ids is not None:
        stmt = select(Layer).where(Layer.id.in_(payload.layer_ids))
        result = await db.execute(stmt)
        project.layers = list(result.scalars().all())
    await db.commit()
    await db.refresh(project)
    return project


@router.patch("/{project_id}/", response_model=ProjectSchema)
async def partial_update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    data = payload.model_dump(exclude_unset=True, exclude={"layer_ids"})
    for key, value in data.items():
        setattr(project, key, value)
    if payload.layer_ids is not None:
        stmt = select(Layer).where(Layer.id.in_(payload.layer_ids))
        result = await db.execute(stmt)
        project.layers = list(result.scalars().all())
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}/", status_code=204)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
