"""
Job Management API Routes

This module provides REST endpoints for job management with
asynchronous task execution via Celery.

Features:
- Submit jobs asynchronously (returns job ID immediately)
- Poll job status
- WebSocket support for real-time updates
- Job history and cancellation

Example:
    POST /api/v1/jobs/etl
    Response: {"job_id": "uuid", "status": "pending", "status_url": "/api/v1/jobs/uuid"}
    
    WS /api/v1/ws/jobs/{job_id}
    Real-time job updates
"""

import logging
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.core.database import get_db_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.job import Job, JobStatus
from app.tasks.celery_app import celery_app, TaskStatus
from app.tasks.websocket_manager import ws_manager, JobNotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


# Request/Response Models
class ETLJobRequest(BaseModel):
    """Request model for starting an ETL job."""
    source_id: UUID = Field(..., description="ID of the source to process")
    operation: str = Field(
        default="process",
        description="Type of operation (process, import, transform)"
    )
    options: Optional[dict] = Field(default=None, description="Additional processing options")


class MLJobRequest(BaseModel):
    """Request model for starting an ML job."""
    source_id: UUID = Field(..., description="ID of the source to analyze")
    model_type: str = Field(
        default="isolation_forest",
        description="Type of ML model to use"
    )


class JobResponse(BaseModel):
    """Response model for job information."""
    job_id: UUID
    job_type: str
    status: str
    source_id: Optional[UUID] = None
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None
    status_url: str


class JobListResponse(BaseModel):
    """Response model for job lists."""
    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int


# Job Submission Endpoints
@router.post(
    "/etl",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit ETL Job",
    description="Submit a long-running ETL job for asynchronous processing",
)
async def submit_etl_job(
    request: ETLJobRequest,
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    """
    Submit an ETL job for processing.
    
    The job is queued for asynchronous processing and a job ID is returned
    immediately. Use WebSocket or status endpoint to track progress.
    """
    from app.tasks.etl_tasks import process_etl_job
    from datetime import datetime
    
    # Create job record
    job_id = UUID()
    
    async with get_db_session() as session:
        job = Job(
            id=job_id,
            job_type="etl",
            status=JobStatus.PENDING,
            user_id=current_user.id,
            source_id=request.source_id,
            options=request.options,
        )
        session.add(job)
        await session.commit()
    
    # Enqueue Celery task
    task = process_etl_job.delay(
        job_id=str(job_id),
        source_id=str(request.source_id),
        user_id=str(current_user.id),
        operation=request.operation,
        options=request.options,
    )
    
    logger.info(f"ETL job {job_id} submitted by user {current_user.id}")
    
    return JobResponse(
        job_id=job_id,
        job_type="etl",
        status=JobStatus.PENDING,
        source_id=request.source_id,
        created_at=job.created_at.isoformat(),
        status_url=f"/api/v1/jobs/{job_id}",
    )


@router.post(
    "/ml",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit ML Job",
    description="Submit a machine learning job for training and inference",
)
async def submit_ml_job(
    request: MLJobRequest,
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    """
    Submit an ML job for training and inference.
    
    Runs isolation forest or other ML models on the source data.
    """
    from app.tasks.etl_tasks import run_trainandinfer
    from datetime import datetime
    
    # Create job record
    job_id = UUID()
    
    async with get_db_session() as session:
        job = Job(
            id=job_id,
            job_type="ml",
            status=JobStatus.PENDING,
            user_id=current_user.id,
            source_id=request.source_id,
            options={"model_type": request.model_type},
        )
        session.add(job)
        await session.commit()
    
    # Enqueue Celery task
    task = run_trainandinfer.delay(
        job_id=str(job_id),
        source_id=str(request.source_id),
        user_id=str(current_user.id),
        model_type=request.model_type,
    )
    
    logger.info(f"ML job {job_id} submitted by user {current_user.id}")
    
    return JobResponse(
        job_id=job_id,
        job_type="ml",
        status=JobStatus.PENDING,
        source_id=request.source_id,
        created_at=job.created_at.isoformat(),
        status_url=f"/api/v1/jobs/{job_id}",
    )


# Job Status Endpoints
@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get Job Status",
    description="Get the current status and result of a job",
)
async def get_job_status(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    """
    Get job status and details.
    
    Returns the current job status, timing information, and result if complete.
    """
    async with get_db_session() as session:
        job = await session.get(Job, job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found",
            )
        
        # Check ownership
        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this job",
            )
        
        # Get Celery task result if running
        result = None
        error = None
        
        if job.celery_task_id:
            task = celery_app.AsyncResult(job.celery_task_id)
            if task.state == TaskStatus.SUCCESS:
                result = task.result
            elif task.state == TaskStatus.FAILURE:
                error = str(task.info) if task.info else "Unknown error"
        
        return JobResponse(
            job_id=job.id,
            job_type=job.job_type,
            status=job.status.value if hasattr(job.status, 'value') else str(job.status),
            source_id=job.source_id,
            created_at=job.created_at.isoformat(),
            started_at=job.started_at.isoformat() if job.started_at else None,
            completed_at=job.completed_at.isoformat() if job.completed_at else None,
            result=result,
            error=error,
            status_url=f"/api/v1/jobs/{job_id}",
        )


@router.get(
    "/",
    response_model=JobListResponse,
    summary="List Jobs",
    description="List jobs for the current user with pagination",
)
async def list_jobs(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    job_type: Optional[str] = Query(default=None, description="Filter by job type"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
) -> JobListResponse:
    """
    List jobs for the current user.
    
    Supports pagination and filtering by job type and status.
    """
    from sqlalchemy import select, func, desc
    
    async with get_db_session() as session:
        # Build query
        query = select(Job).where(Job.user_id == current_user.id)
        
        if job_type:
            query = query.where(Job.job_type == job_type)
        
        if status:
            query = query.where(Job.status == status)
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await session.execute(count_query)).scalar()
        
        # Apply pagination and ordering
        query = query.order_by(desc(Job.created_at))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        # Execute
        result = await session.execute(query)
        jobs = result.scalars().all()
        
        return JobListResponse(
            jobs=[
                JobResponse(
                    job_id=job.id,
                    job_type=job.job_type,
                    status=job.status.value if hasattr(job.status, 'value') else str(job.status),
                    source_id=job.source_id,
                    created_at=job.created_at.isoformat(),
                    started_at=job.started_at.isoformat() if job.started_at else None,
                    completed_at=job.completed_at.isoformat() if job.completed_at else None,
                    status_url=f"/api/v1/jobs/{job.id}",
                )
                for job in jobs
            ],
            total=total,
            page=page,
            page_size=page_size,
        )


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel Job",
    description="Cancel a running job",
)
async def cancel_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a running job.
    
    Revokes the Celery task and updates job status to cancelled.
    """
    async with get_db_session() as session:
        job = await session.get(Job, job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found",
            )
        
        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this job",
            )
        
        # Revoke Celery task if running
        if job.celery_task_id:
            celery_app.control.revoke(job.celery_task_id, terminate=True)
        
        # Update status
        job.status = JobStatus.CANCELLED
        await session.commit()
        
        logger.info(f"Job {job_id} cancelled by user {current_user.id}")
