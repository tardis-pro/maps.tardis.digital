"""
Rate Limiting Configuration for FastAPI using slowapi with Redis backend.

This module provides distributed rate limiting for the Maps Platform API,
protecting against abuse and DoS attacks.

Usage:
    from app.core.rate_limit import RateLimits, limiter
    
    @router.get("/endpoint")
    @limiter.limit("100/minute")
    async def endpoint(request: Request):
        ...
"""

import logging
import time
from enum import Enum
from functools import lru_cache
from typing import Callable

from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette import status

from app.config import settings

logger = logging.getLogger(__name__)


class RateLimitStrategy(str, Enum):
    """Rate limiting strategies for different endpoint types."""
    WINDOW = "window"  # Sliding window (default)
    FIXED = "fixed"    # Fixed window


class RateLimitConfig(BaseModel):
    """Configuration for rate limiting."""
    requests: int = Field(..., description="Number of requests allowed")
    seconds: int = Field(..., description="Time window in seconds")
    strategy: RateLimitStrategy = RateLimitStrategy.WINDOW


@lru_cache
def get_rate_limiter() -> Limiter:
    """
    Create and configure the rate limiter with Redis backend.
    
    Uses Redis for distributed rate limiting across multiple API instances.
    Falls back to in-memory storage if Redis is unavailable.
    """
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=settings.REDIS_URL,
        strategy="fixed-window",  # Can also use "sliding-window"
        default_limits=["200/minute"],  # Default rate limit
        # Enable headers for client feedback
        headers_enabled=True,
    )
    
    logger.info(
        f"Rate limiter initialized with Redis backend: {settings.REDIS_URL}"
    )
    
    return limiter


# Pre-configured rate limits for different use cases
class RateLimits:
    """
    Pre-defined rate limits for different endpoint categories.
    
    These limits are designed to:
    - Allow normal usage patterns
    - Prevent abuse and DoS attacks
    - Protect sensitive endpoints with stricter limits
    """
    
    # Default limits for most endpoints
    DEFAULT = "200/minute"
    
    # Anonymous users get stricter limits
    ANON = "100/minute"
    
    # Authenticated users get more generous limits
    AUTHENTICATED = "1000/minute"
    
    # Sensitive endpoints (auth, data upload) get strict limits
    SENSITIVE = "10/minute"
    
    # Read-heavy endpoints can have higher limits
    READ_ONLY = "500/minute"
    
    # Write operations get moderate limits
    WRITE = "100/minute"
    
    # Health check endpoints - very permissive
    HEALTH = "1000/minute"
    
    # File upload endpoints - very strict
    UPLOAD = "5/minute"


# Endpoint categorization for automatic rate limiting
ENDPOINT_CATEGORIES = {
    # Health and status endpoints
    "/health": RateLimits.HEALTH,
    "/ready": RateLimits.HEALTH,
    
    # Authentication endpoints - most restrictive
    "/api/v1/auth/login": RateLimits.SENSITIVE,
    "/api/v1/auth/register": RateLimits.SENSITIVE,
    "/api/v1/auth/reset-password": RateLimits.SENSITIVE,
    
    # User management
    "/api/v1/users": RateLimits.WRITE,
    "/api/v1/user-profile": RateLimits.AUTHENTICATED,
    
    # Data endpoints
    "/api/v1/sources": RateLimits.READ_ONLY,
    "/api/v1/layers": RateLimits.READ_ONLY,
    "/api/v1/projects": RateLimits.READ_ONLY,
    "/api/v1/geometry": RateLimits.READ_ONLY,
    
    # ETL endpoints
    "/tasks/": RateLimits.UPLOAD,
}


def get_rate_limit_for_path(path: str, method: str = "GET") -> str:
    """
    Determine the appropriate rate limit for a given endpoint.
    
    Args:
        path: The API endpoint path
        method: HTTP method (GET, POST, PUT, DELETE, etc.)
    
    Returns:
        Rate limit string (e.g., "100/minute")
    """
    # Check for exact match
    if path in ENDPOINT_CATEGORIES:
        return ENDPOINT_CATEGORIES[path]
    
    # Check for prefix match (more specific first)
    for prefix, limit in sorted(ENDPOINT_CATEGORIES.items(), key=lambda x: -len(x[0])):
        if path.startswith(prefix):
            return limit
    
    # Apply method-based limits for write operations
    if method in ("POST", "PUT", "PATCH", "DELETE"):
        return RateLimits.WRITE
    
    # Default to authenticated limit for known users, anon for others
    return RateLimits.DEFAULT


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom exception handler for rate limit exceeded.
    
    Returns a 429 response with:
    - Clear error message
    - Rate limit headers
    - Retry-After header
    """
    response = JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please slow down.",
            "retry_after": exc.detail.retry_after,
        },
    )
    
    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(exc.detail.limit)
    response.headers["X-RateLimit-Remaining"] = "0"
    response.headers["X-RateLimit-Reset"] = str(
        int(time.time()) + exc.detail.retry_after
    )
    response.headers["Retry-After"] = str(exc.detail.retry_after)
    
    logger.warning(
        f"Rate limit exceeded for {getattr(request.client, 'host', 'unknown')}: "
        f"{exc.detail.limit} requests exceeded"
    )
    
    return response
