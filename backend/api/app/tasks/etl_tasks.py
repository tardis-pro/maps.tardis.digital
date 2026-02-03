"""
ETL Tasks for Event-Driven Pipeline

This module defines Celery tasks for long-running ETL operations.
Tasks are decoupled from the HTTP request cycle, preventing
timeouts and improving scalability.

Architecture:
- API Endpoint: Enqueues task and returns job ID immediately
- Celery Worker: Processes task asynchronously
- WebSocket: Pushes "Job Complete" notifications
- Result Backend: Stores task status for polling

Example Usage:
    # Enqueue job
    task = process_etl_job.delay(job_id="job-123", user_id="user-456")
    
    # Check status
    if task.ready():
        result = task.result
"""

import logging
from typing import Optional
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.models.source import Source
from app.models.geometry import Geometry
from app.tasks.celery_app import TaskStatus

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="app.tasks.etl_tasks.process_etl_job",
    max_retries=3,
    default_retry_delay=60,
)
def process_etl_job(
    self,
    job_id: str,
    source_id: str,
    user_id: str,
    operation: str = "process",
    options: Optional[dict] = None,
) -> dict:
    """
    Process an ETL job asynchronously.

    Args:
        job_id: Unique identifier for this job
        source_id: ID of the source to process
        user_id: ID of the user who initiated the job
        operation: Type of ETL operation (process, import, transform)
        options: Additional processing options

    Returns:
        dict: Job result with status and any generated data
    """
    logger.info(f"Starting ETL job {job_id} for source {source_id}")

    try:
        # Update job status to running
        self.update_state(state=TaskStatus.STARTED, meta={"status": "Processing started"})

        # Get database session
        async with get_db_session() as session:
            # Fetch source data
            source = await session.get(Source, source_id)
            if not source:
                raise ValueError(f"Source {source_id} not found")

            # Update source status
            source.status = "processing"
            await session.commit()

            # Process based on operation type
            if operation == "process":
                result = await _process_source(session, source, options or {})
            elif operation == "import":
                result = await _import_source(session, source, options or {})
            elif operation == "transform":
                result = await _transform_source(session, source, options or {})
            else:
                raise ValueError(f"Unknown operation: {operation}")

            # Update source status to completed
            source.status = "completed"
            source.processed_at = datetime.utcnow()
            await session.commit()

            logger.info(f"ETL job {job_id} completed successfully")

            return {
                "job_id": job_id,
                "source_id": source_id,
                "status": TaskStatus.SUCCESS,
                "result": result,
            }

    except SoftTimeLimitExceeded:
        logger.error(f"ETL job {job_id} timed out")
        await _mark_source_failed(source_id, "Task timed out")
        raise

    except Exception as e:
        logger.error(f"ETL job {job_id} failed: {str(e)}")
        await _mark_source_failed(source_id, str(e))

        # Retry on transient failures
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying ETL job {job_id} (attempt {self.request.retries + 1})")
            raise self.retry(exc=e)

        return {
            "job_id": job_id,
            "source_id": source_id,
            "status": TaskStatus.FAILURE,
            "error": str(e),
        }


async def _process_source(session: AsyncSession, source: Source, options: dict) -> dict:
    """Process source data based on its type."""
    # Implementation depends on source type
    # This is a placeholder - actual logic would be more complex
    return {
        "processed_records": 100,
        "duration_seconds": 5.0,
        "output_geometry_count": 50,
    }


async def _import_source(session: AsyncSession, source: Source, options: dict) -> dict:
    """Import data from external source."""
    # Implementation for importing data
    return {
        "imported_records": 200,
        "duration_seconds": 10.0,
        "source_type": source.source_type,
    }


async def _transform_source(session: AsyncSession, source: Source, options: dict) -> dict:
    """Transform source data."""
    # Implementation for transforming data
    return {
        "transformed_records": 150,
        "duration_seconds": 8.0,
        "transformations_applied": 3,
    }


async def _mark_source_failed(source_id: str, error: str):
    """Mark source as failed in database."""
    try:
        async with get_db_session() as session:
            source = await session.get(Source, source_id)
            if source:
                source.status = "failed"
                source.error_message = error
                await session.commit()
    except Exception as e:
        logger.error(f"Failed to mark source {source_id} as failed: {e}")


@shared_task(
    bind=True,
    name="app.tasks.etl_tasks.run_trainandinfer",
    max_retries=2,
    soft_time_limit=3600,  # 1 hour soft limit
)
def run_trainandinfer(
    self,
    job_id: str,
    source_id: str,
    user_id: str,
    model_type: str = "isolation_forest",
) -> dict:
    """
    Run machine learning training and inference.

    This is a long-running task that can take several minutes,
    making it perfect for asynchronous execution.

    Args:
        job_id: Unique identifier for this job
        source_id: ID of the source to analyze
        user_id: ID of the user who initiated the job
        model_type: Type of ML model to use

    Returns:
        dict: Analysis results with insights
    """
    logger.info(f"Starting ML job {job_id} for source {source_id}")

    try:
        self.update_state(state=TaskStatus.STARTED, meta={"status": "Training model"})

        # Import ML modules (heavy imports should be inside task)
        import sys
        sys.path.append("/backend/etl")
        from trainandinfer import train_and_infer

        # Run ML pipeline
        results = train_and_infer(source_id=source_id, model_type=model_type)

        logger.info(f"ML job {job_id} completed")

        return {
            "job_id": job_id,
            "source_id": source_id,
            "status": TaskStatus.SUCCESS,
            "result": results,
        }

    except SoftTimeLimitExceeded:
        logger.error(f"ML job {job_id} timed out")
        return {
            "job_id": job_id,
            "source_id": source_id,
            "status": TaskStatus.FAILURE,
            "error": "Task timed out after 1 hour",
        }

    except Exception as e:
        logger.error(f"ML job {job_id} failed: {str(e)}")
        return {
            "job_id": job_id,
            "source_id": source_id,
            "status": TaskStatus.FAILURE,
            "error": str(e),
        }


@shared_task(
    name="app.tasks.etl_tasks.cleanup_old_jobs",
)
def cleanup_old_jobs(days_old: int = 7) -> dict:
    """
    Clean up old job records and associated data.

    Args:
        days_old: Delete jobs older than this many days

    Returns:
        dict: Cleanup statistics
    """
    import asyncio
    from datetime import datetime, timedelta
    from sqlalchemy import delete
    from app.models.job import Job

    async def _cleanup():
        cutoff = datetime.utcnow() - timedelta(days=days_old)

        # This would need proper async SQLAlchemy syntax
        # Simplified version
        logger.info(f"Cleaning up jobs older than {days_old} days")
        return {"deleted_jobs": 0}

    try:
        result = asyncio.run(_cleanup())
        return {
            "status": "success",
            **result,
        }
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return {"status": "error", "error": str(e)}


# Import datetime for the main task
from datetime import datetime
