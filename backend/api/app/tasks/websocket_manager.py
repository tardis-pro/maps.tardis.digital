"""
WebSocket Manager for Real-Time Notifications

This module provides WebSocket support for pushing job completion
notifications to the frontend in real-time.

Architecture:
- WebSocket Endpoint: /ws/jobs/{job_id}
- Connection Manager: Handles multiple WebSocket connections
- Notification Service: Broadcasts job status updates

Usage:
    # Send notification
    await ws_manager.send_job_update(job_id, {"status": "completed", "result": {...}})
    
    # Client connects
    const ws = new WebSocket('ws://api/jobs/job-123');
"""

import json
import logging
from typing import Dict, Set, Optional
from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time updates.
    
    Maintains a dictionary of active connections keyed by job_id.
    Supports broadcasting to multiple connected clients.
    """
    
    def __init__(self):
        # job_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # connection -> job_id mapping for cleanup
        self.connection_jobs: Dict[WebSocket, str] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        job_id: str,
    ) -> None:
        """
        Accept a new WebSocket connection and subscribe to job updates.
        
        Args:
            websocket: The WebSocket connection
            job_id: The job ID to subscribe to
        """
        await websocket.accept()
        
        if job_id not in self.active_connections:
            self.active_connections[job_id] = set()
        
        self.active_connections[job_id].add(websocket)
        self.connection_jobs[websocket] = job_id
        
        logger.info(f"WebSocket connected for job {job_id}")
    
    async def disconnect(
        self,
        websocket: WebSocket,
    ) -> None:
        """
        Remove a WebSocket connection and clean up mappings.
        
        Args:
            websocket: The WebSocket connection to remove
        """
        job_id = self.connection_jobs.pop(websocket, None)
        
        if job_id and job_id in self.active_connections:
            self.active_connections[job_id].discard(websocket)
            
            # Clean up empty job connections
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]
        
        logger.info(f"WebSocket disconnected for job {job_id}")
    
    async def send_personal_message(
        self,
        message: dict,
        websocket: WebSocket,
    ) -> None:
        """
        Send a message to a single WebSocket connection.
        
        Args:
            message: The message to send (will be JSON serialized)
            websocket: The target WebSocket connection
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send WebSocket message: {e}")
    
    async def broadcast(
        self,
        job_id: str,
        message: dict,
    ) -> None:
        """
        Broadcast a message to all connections subscribed to a job.
        
        Args:
            job_id: The job ID to broadcast to
            message: The message to broadcast
        """
        if job_id not in self.active_connections:
            return
        
        disconnected = []
        
        for connection in self.active_connections[job_id]:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                disconnected.append(connection)
            except Exception as e:
                logger.error(f"Failed to broadcast to connection: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            await self.disconnect(conn)


# Global connection manager instance
ws_manager = ConnectionManager()


class JobNotificationService:
    """
    Service for sending job-related notifications via WebSocket.
    
    Provides high-level methods for common notification patterns.
    """
    
    @staticmethod
    async def job_started(job_id: str, message: str = "Job processing started") -> None:
        """Notify that a job has started processing."""
        await ws_manager.broadcast(
            job_id,
            {
                "type": "job_started",
                "job_id": job_id,
                "message": message,
                "timestamp": _get_timestamp(),
            },
        )
    
    @staticmethod
    async def job_progress(
        job_id: str,
        progress: float,
        stage: str,
        details: Optional[dict] = None,
    ) -> None:
        """
        Notify about job progress.
        
        Args:
            job_id: The job ID
            progress: Progress percentage (0-100)
            stage: Current processing stage name
            details: Additional progress details
        """
        await ws_manager.broadcast(
            job_id,
            {
                "type": "job_progress",
                "job_id": job_id,
                "progress": progress,
                "stage": stage,
                "details": details or {},
                "timestamp": _get_timestamp(),
            },
        )
    
    @staticmethod
    async def job_completed(
        job_id: str,
        result: dict,
    ) -> None:
        """
        Notify that a job has completed successfully.
        
        Args:
            job_id: The job ID
            result: The job result data
        """
        await ws_manager.broadcast(
            job_id,
            {
                "type": "job_completed",
                "job_id": job_id,
                "result": result,
                "timestamp": _get_timestamp(),
            },
        )
    
    @staticmethod
    async def job_failed(
        job_id: str,
        error: str,
        details: Optional[dict] = None,
    ) -> None:
        """
        Notify that a job has failed.
        
        Args:
            job_id: The job ID
            error: Error message
            details: Additional error details
        """
        await ws_manager.broadcast(
            job_id,
            {
                "type": "job_failed",
                "job_id": job_id,
                "error": error,
                "details": details or {},
                "timestamp": _get_timestamp(),
            },
        )
    
    @staticmethod
    async def insight_generated(
        job_id: str,
        insight_type: str,
        data: dict,
    ) -> None:
        """
        Notify about a new insight generated during processing.
        
        Args:
            job_id: The job ID
            insight_type: Type of insight (e.g., "outlier", "cluster")
            data: Insight data
        """
        await ws_manager.broadcast(
            job_id,
            {
                "type": "insight_generated",
                "job_id": job_id,
                "insight_type": insight_type,
                "data": data,
                "timestamp": _get_timestamp(),
            },
        )


def _get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    from datetime import datetime
    return datetime.utcnow().isoformat()
