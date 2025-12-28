import os
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.config import settings
from app.core.database import get_db
from app.models import Task, TaskStatus

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskResponse(BaseModel):
    id: int
    task_type: str
    status: str
    progress: int
    params: dict
    result: dict | None
    error: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    class Config:
        from_attributes = True


async def save_upload(file: UploadFile) -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    path = os.path.join(settings.UPLOAD_DIR, file.filename)
    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)
    return path


@router.post("/import/shapefile", response_model=TaskResponse)
async def import_shapefile(
    file: UploadFile,
    source_name: str = Form(...),
    source_type: str = Form("vector"),
    srid: int = Form(4326),
    db: AsyncSession = Depends(get_db),
):
    file_path = await save_upload(file)
    task = Task(
        task_type="shapefile_import",
        status=TaskStatus.PENDING,
        params={"file_path": file_path, "source_name": source_name, "source_type": source_type, "srid": srid},
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/import/csv", response_model=TaskResponse)
async def import_csv(
    file: UploadFile,
    source_name: str = Form(...),
    lon_col: str = Form("longitude"),
    lat_col: str = Form("latitude"),
    db: AsyncSession = Depends(get_db),
):
    file_path = await save_upload(file)
    task = Task(
        task_type="csv_import",
        status=TaskStatus.PENDING,
        params={"file_path": file_path, "source_name": source_name, "lon_col": lon_col, "lat_col": lat_col},
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/import/geojson", response_model=TaskResponse)
async def import_geojson(
    file: UploadFile,
    source_name: str = Form(...),
    source_type: str = Form("vector"),
    db: AsyncSession = Depends(get_db),
):
    file_path = await save_upload(file)
    task = Task(
        task_type="geojson_import",
        status=TaskStatus.PENDING,
        params={"file_path": file_path, "source_name": source_name, "source_type": source_type},
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
