"""
Sentry Integration for Maps Platform API.

This module provides error monitoring and performance tracing
using Sentry for the FastAPI backend.
"""

import logging
from typing import Optional

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)


class SentryConfig(BaseModel):
    """Sentry configuration."""
    dsn: Optional[str] = None
    environment: str = "development"
    release: Optional[str] = None
    traces_sample_rate: float = 0.2
    profiles_sample_rate: float = 0.1
    send_default_pii: bool = False
    attach_stacktrace: bool = True


def get_sentry_config() -> SentryConfig:
    """
    Get Sentry configuration from settings.
    
    Reads from environment variables and app settings.
    """
    return SentryConfig(
        dsn=getattr(settings, "SENTRY_DSN", None),
        environment=getattr(settings, "ENVIRONMENT", "development"),
        release=getattr(settings, "VERSION", None),
        traces_sample_rate=0.2,
        profiles_sample_rate=0.1,
        send_default_pii=False,
        attach_stacktrace=True,
    )


def setup_sentry(config: Optional[SentryConfig] = None) -> None:
    """
    Initialize Sentry with appropriate integrations.
    
    Args:
        config: Sentry configuration (uses default if not provided)
    """
    config = config or get_sentry_config()
    
    if not config.dsn:
        logger.info("Sentry DSN not configured, error monitoring disabled")
        return
    
    sentry_sdk.init(
        dsn=config.dsn,
        environment=config.environment,
        release=config.release,
        traces_sample_rate=config.traces_sample_rate,
        profiles_sample_rate=config.profiles_sample_rate,
        send_default_pii=config.send_default_pii,
        attach_stacktrace=config.attach_stacktrace,
        
        # Enable integrations
        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",
                middleware_spans=True,
            ),
            RedisIntegration(),
            SqlalchemyIntegration(),
        ],
        
        # Filter sensitive data
        before_send=filter_sensitive_data,
        
        # Performance monitoring settings
        _experiments={
            "max_spans": 1000,
            "continuous_profiling": False,
        },
    )
    
    logger.info(
        f"Sentry initialized: environment={config.environment}, "
        f"traces_sample_rate={config.traces_sample_rate}"
    )


def filter_sensitive_data(event: dict, hint: dict) -> Optional[dict]:
    """
    Filter sensitive data from error reports.
    
    Args:
        event: Sentry event dict
        hint: Event hint with exception info
    
    Returns:
        Filtered event or None to drop
    """
    # Remove sensitive headers
    if "request" in event:
        headers = event.get("request", {}).get("headers", {})
        sensitive_headers = [
            "authorization",
            "cookie",
            "x-api-key",
            "x-auth-token",
        ]
        
        for header in sensitive_headers:
            if header in headers:
                headers[header] = "[FILTERED]"
    
    # Remove sensitive environment variables
    if "env" in event:
        sensitive_keys = [
            "DATABASE_URL",
            "REDIS_URL",
            "SECRET_KEY",
            "API_KEY",
        ]
        
        for key in sensitive_keys:
            event["env"].pop(key, None)
    
    return event


def capture_exception(exc: Exception, **kwargs) -> Optional[str]:
    """
    Capture an exception to Sentry.
    
    Args:
        exc: Exception to capture
        **kwargs: Additional context
    
    Returns:
        Event ID if successful
    """
    return sentry_sdk.capture_exception(exc, **kwargs)


def capture_message(
    message: str,
    level: str = "info",
    **kwargs,
) -> Optional[str]:
    """
    Capture a message to Sentry.
    
    Args:
        message: Message to capture
        level: Log level (debug, info, warning, error, fatal)
        **kwargs: Additional context
    
    Returns:
        Event ID if successful
    """
    return sentry_sdk.capture_message(message, level=level, **kwargs)


def set_user_context(
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    **kwargs,
) -> None:
    """
    Set user context for error reports.
    
    Args:
        user_id: User identifier
        email: User email
        **kwargs: Additional user data
    """
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        **kwargs,
    })


def add_breadcrumb(
    category: str,
    message: str,
    level: str = "info",
    data: Optional[dict] = None,
) -> None:
    """
    Add a breadcrumb to the current trace.
    
    Breadcrumbs provide context for error reports.
    
    Args:
        category: Breadcrumb category
        message: Breadcrumb message
        level: Log level
        data: Additional data
    """
    sentry_sdk.add_breadcrumb(
        category=category,
        message=message,
        level=level,
        data=data,
    )


def set_tag(key: str, value: str) -> None:
    """
    Set a tag for all future events.
    
    Args:
        key: Tag name
        value: Tag value
    """
    sentry_sdk.set_tag(key, value)


def set_context(name: str, context: dict) -> None:
    """
    Set additional context for error reports.
    
    Args:
        name: Context name
        context: Context data
    """
    sentry_sdk.set_context(name, context)


class SentryMiddleware:
    """
    FastAPI middleware for automatic Sentry integration.
    
    Captures:
    - Unhandled exceptions
    - HTTP request/response data
    - Performance spans
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Add request info to Sentry
        sentry_sdk.set_tag("http.method", scope.get("method", ""))
        sentry_sdk.set_tag("http.url", scope.get("root_path", ""))
        
        await self.app(scope, receive, send)


def get_sentry_handlers() -> dict:
    """
    Get exception handlers for FastAPI.
    
    Returns:
        Dict of exception handlers for FastAPI.exception_handlers
    """
    from fastapi import Request, HTTPException
    from fastapi.responses import JSONResponse
    
    async def sentry_exception_handler(
        request: Request,
        exc: HTTPException,
    ) -> JSONResponse:
        """Handle HTTP exceptions with Sentry."""
        capture_exception(exc)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    
    async def generic_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """Handle all other exceptions with Sentry."""
        capture_exception(exc)
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
    
    return {
        HTTPException: sentry_exception_handler,
        Exception: generic_exception_handler,
    }
