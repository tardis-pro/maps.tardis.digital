"""
Celery Configuration for Event-Driven ETL Pipeline

This module configures Celery for asynchronous task processing
using Redis as the message broker. It enables decoupled,
scalable background job execution for long-running ETL operations.

Architecture:
- Redis: Message broker for task queue
- Celery: Distributed task queue
- Result Backend: Redis for task status storage

Usage:
    from app.tasks.celery_app import celery_app
    
    @celery_app.task
    def process_etl_job(job_id: str):
        # Your ETL processing logic
        pass
    
    # Dispatch job
    process_etl_job.delay(job_id)
"""

import os
from celery import Celery
from kombu import Queue
from kombu.serialization import register
import json

# Redis configuration from environment
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Create Celery application
celery_app = Celery(
    "maps_tardis_etl",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "app.tasks.etl_tasks",
        "app.tasks.data_enrichment",
        "app.tasks.insight_generation",
    ],
)

# Celery configuration
celery_app.conf.update(
    # Task serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,  # Process one task at a time
    
    # Task routing
    task_queues={
        "default": {
            "exchange": "default",
            "routing_key": "default",
        },
        "processing": {
            "exchange": "processing",
            "routing_key": "etl",
        },
        "enrichment": {
            "exchange": "enrichment",
            "routing_key": "enrich",
        },
        "insights": {
            "exchange": "insights",
            "routing_key": "insight",
        },
    },
    task_routes={
        "app.tasks.etl_tasks.*": {"queue": "processing"},
        "app.tasks.data_enrichment.*": {"queue": "enrichment"},
        "app.tasks.insight_generation.*": {"queue": "insights"},
    },
    
    # Worker settings
    worker_concurrency=4,
    worker_prefetch_multiplier=1,
    
    # Task retry settings
    task_default_retry_delay=60,
    task_max_retries=3,
    
    # Beat schedule for periodic tasks
    beat_schedule={},
)

# Configure JSON serialization for Kombu
def json_dumps(obj):
    return json.dumps(obj).encode("utf-8")


def json_loads(data):
    return json.loads(data.decode("utf-8"))


register(
    "custom-json",
    json_dumps,
    json_loads,
    content_type="application/json+custom",
)


class TaskStatus:
    """Task status constants for consistent status reporting."""
    PENDING = "pending"
    STARTED = "started"
    PROGRESS = "progress"
    SUCCESS = "success"
    FAILURE = "failure"
    RETRY = "retry"
    REVOKED = "revoked"


# Task result wrapper for consistent API responses
class TaskResult:
    """Wrapper for task results with metadata."""
    
    def __init__(self, task_id: str, status: str, result=None, error=None):
        self.task_id = task_id
        self.status = status
        self.result = result
        self.error = error
        self.created_at = None
        self.completed_at = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "task_id": self.task_id,
            "status": self.status,
            "result": self.result,
            "error": str(self.error) if self.error else None,
        }


# Import task modules to register tasks with Celery
# These imports must be after celery_app configuration
from app.tasks import etl_tasks  # noqa: F401
from app.tasks import data_enrichment  # noqa: F401
from app.tasks import insight_generation  # noqa: F401
