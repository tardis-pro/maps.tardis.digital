"""
Grafana Loki Integration for Structured Logging.

This module provides JSON-structured logging with Loki log shipping
for the Maps Platform API.
"""

import logging
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel
from pythonjsonlogger import jsonlogger
import requests

from app.config import settings

logger = logging.getLogger(__name__)


class LokiConfig(BaseModel):
    """Loki configuration."""
    url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    tenant_id: Optional[str] = None
    labels: Dict[str, str] = None
    batch_size: int = 100
    flush_interval: float = 1.0
    timeout: float = 10.0


class LokiHandler(jsonlogger.JsonFormatter):
    """
    Log handler that ships logs to Grafana Loki.
    
    Features:
    - Structured JSON logging
    - Automatic batching
    - Retry on failure
    - Labels for filtering
    """
    
    def __init__(self, config: Optional[LokiConfig] = None, **kwargs):
        """
        Initialize Loki handler.
        
        Args:
            config: Loki configuration
            **kwargs: Additional arguments for parent class
        """
        super().__init__(
            fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
            **kwargs,
        )
        
        self.config = config or LokiConfig(
            url=getattr(settings, "LOKI_URL", None),
            labels={
                "app": "maps-api",
                "environment": getattr(settings, "ENVIRONMENT", "development"),
            },
        )
        
        self._batch: list = []
        self._last_flush: float = time.time()
        self._session: Optional[requests.Session] = None
        
        # Create session for connection pooling
        if self.config.url:
            self._session = requests.Session()
            if self.config.username and self.config.password:
                self._session.auth = (
                    self.config.username,
                    self.config.password,
                )
    
    def get_loki_url(self) -> Optional[str]:
        """Get the Loki push API URL."""
        if not self.config.url:
            return None
        
        url = self.config.url.rstrip("/")
        
        # Add tenant ID for multi-tenant Loki
        if self.config.tenant_id:
            url = f"{url}/loki/api/v1/tenant/{self.config.tenant_id}/push"
        else:
            url = f"{url}/loki/api/v1/push"
        
        return url
    
    def build_label_set(self, record: logging.LogRecord) -> Dict[str, str]:
        """Build labels for a log record."""
        labels = dict(self.config.labels)
        
        # Add level as label
        labels["level"] = record.levelname
        
        # Add logger name as label
        labels["logger"] = record.name
        
        return labels
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format the log record as JSON.
        
        Args:
            record: LogRecord to format
        
        Returns:
            JSON string representation
        """
        # Get the default formatted message
        message = super().format(record)
        
        # Build log entry
        log_entry = {
            "timestamp": str(int(record.created * 1e9)),  # Nanoseconds
            "stream": "stdout",
            "labels": self.build_label_set(record),
            "line": record.line_no,
            "file": record.filename,
            "level": record.levelname,
            "message": message,
        }
        
        # Add exception info
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        extra = getattr(record, "extra", {})
        for key, value in extra.items():
            if key not in ("level", "msg", "exc_info", "args"):
                try:
                    log_entry[key] = value
                except (TypeError, ValueError):
                    log_entry[key] = str(value)
        
        # Add request context if available
        request_id = getattr(record, "request_id", None)
        if request_id:
            log_entry["request_id"] = request_id
        
        user_id = getattr(record, "user_id", None)
        if user_id:
            log_entry["user_id"] = user_id
        
        return super().format(record)
    
    def emit(self, record: logging.LogRecord) -> None:
        """
        Emit a log record to Loki.
        
        Args:
            record: LogRecord to emit
        """
        # Skip if Loki is not configured
        if not self.config.url or not self._session:
            # Fall back to standard output
            super().emit(record)
            return
        
        try:
            formatted = self.format(record)
            log_entry = self._parse_log_line(formatted)
            
            if log_entry:
                self._batch.append(log_entry)
                
                # Flush if batch is full
                if len(self._batch) >= self.config.batch_size:
                    self.flush()
        
        except Exception as e:
            # Don't let logging failures crash the app
            print(f"Loki emit error: {e}", file=sys.stderr)
    
    def _parse_log_line(self, line: str) -> Optional[Dict[str, Any]]:
        """
        Parse a JSON log line.
        
        Args:
            line: JSON log line
        
        Returns:
            Loki log entry or None
        """
        try:
            import json
            data = json.loads(line)
            
            # Extract Loki-compatible format
            return {
                "streams": [
                    {
                        "stream": data.get("labels", {}),
                        "values": [
                            [
                                str(int(datetime.now(timezone.utc).timestamp() * 1e9)),
                                data.get("message", ""),
                            ]
                        ],
                    }
                ]
            }
        except (json.JSONDecodeError, KeyError):
            return None
    
    def flush(self) -> None:
        """Flush the current batch to Loki."""
        if not self._batch or not self._session:
            return
        
        batch = self._batch[:]
        self._batch.clear()
        
        try:
            url = self.get_loki_url()
            if not url:
                return
            
            # Build Loki push request
            payload = {
                "streams": [
                    {
                        "stream": entry["streams"][0]["stream"],
                        "values": entry["streams"][0]["values"],
                    }
                    for entry in batch
                ]
            }
            
            response = self._session.post(
                url,
                json=payload,
                timeout=self.config.timeout,
            )
            
            response.raise_for_status()
            logger.debug(f"Flushed {len(batch)} logs to Loki")
        
        except requests.RequestException as e:
            # Log error but don't crash
            print(f"Loki flush error: {e}", file=sys.stderr)
    
    def close(self) -> None:
        """Close the handler and flush any remaining logs."""
        self.flush()
        
        if self._session:
            self._session.close()
        
        super().close()


def setup_logging(
    log_level: str = "INFO",
    loki_config: Optional[LokiConfig] = None,
) -> logging.Logger:
    """
    Configure structured logging for the application.
    
    Args:
        log_level: Minimum log level
        loki_config: Optional Loki configuration
    
    Returns:
        Configured root logger
    """
    # Create formatter
    formatter = LokiHandler(
        config=loki_config,
        timestamp=True,
        rename_fields={
            "asctime": "timestamp",
            "levelname": "level",
            "name": "logger",
        },
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Add console handler for local development
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    logger.info(
        f"Logging configured: level={log_level}, "
        f"loki_url={loki_config.url if loki_config else 'not configured'}"
    )
    
    return root_logger


class RequestContextFilter(logging.Filter):
    """
    Filter that adds request context to log records.
    
    Usage:
        logger.addFilter(RequestContextFilter())
    """
    
    def __init__(self, get_request_id=None, get_user_id=None):
        """
        Initialize the filter.
        
        Args:
            get_request_id: Callable to get current request ID
            get_user_id: Callable to get current user ID
        """
        super().__init__()
        self.get_request_id = get_request_id
        self.get_user_id = get_user_id
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add context to the record."""
        if self.get_request_id:
            record.request_id = self.get_request_id()
        
        if self.get_user_id:
            record.user_id = self.get_user_id()
        
        return True


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the standard configuration.
    
    Args:
        name: Logger name
    
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)
