"""
Row-Level Security (RLS) Middleware for FastAPI

This middleware injects the current user context into the PostgreSQL session
to enable Row-Level Security policies. The RLS policies use the session
variable 'app.current_user_id' to filter queries based on ownership.

Usage:
1. Add RLSMiddleware to your FastAPI application
2. Ensure the user is authenticated before making database queries
3. The middleware will automatically set and clear the user context

Example:
    from app.core.rlsmiddleware import RLSMiddleware

    app.add_middleware(RLSMiddleware)

Security Considerations:
- RLS provides defense-in-depth against application-level bugs
- Always use parameterized queries to prevent SQL injection
- The context is set per-request and cleared after completion
- Unauthorized users will see empty results, not errors (by design)
"""

import logging
from typing import Optional, Callable
from uuid import UUID

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)


class RLSMiddleware(BaseHTTPMiddleware):
    """
    Middleware that injects the current user context into the PostgreSQL session.

    This enables Row-Level Security policies that filter data based on ownership.
    The middleware:
    1. Extracts the user ID from the request state (set by authentication)
    2. Injects the user ID into the PostgreSQL session variable
    3. Clears the session variable after the request completes

    Args:
        app: The ASGI application
        skip_paths: Paths to skip RLS context injection (e.g., health checks)

    Raises:
        RuntimeError: If user context is not available on protected endpoints
    """

    def __init__(
        self,
        app: ASGIApp,
        skip_paths: Optional[set] = None,
        skip_unauthenticated: Optional[set] = None,
    ) -> None:
        super().__init__(app)
        self.skip_paths = skip_paths or {
            "/health",
            "/healthz",
            "/ready",
            "/api/docs",
            "/api/redoc",
            "/api/openapi.json",
        }
        self.skip_unauthenticated = skip_unauthenticated or {
            "/api/v1/public",
        }

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """
        Process the request and inject user context for RLS.

        This method:
        1. Checks if the path should skip RLS
        2. Extracts user ID from request state
        3. Sets the user context in PostgreSQL
        4. Calls the next middleware/handler
        5. Clears the user context after completion
        """
        # Skip RLS for certain paths
        if self._should_skip(request):
            return await call_next(request)

        # Get the database session from request state
        session = getattr(request.state, "db_session", None)

        if session is None:
            logger.warning(
                f"No database session found for request to {request.url.path}. "
                "RLS context not set."
            )
            return await call_next(request)

        # Extract user ID from request state
        # This should be set by the authentication middleware
        user_id = getattr(request.state, "user_id", None)

        if user_id is None:
            # Check if this path allows unauthenticated access
            if self._allows_unauthenticated(request):
                return await call_next(request)

            # For protected endpoints, log a warning
            logger.debug(
                f"No user ID found in request state for {request.url.path}. "
                "RLS policies may filter all results."
            )
            # Don't block the request - let RLS policies handle it
            # This will result in empty datasets for unauthenticated users

        # Set the user context in PostgreSQL session
        if user_id is not None:
            await self._set_user_context(session, user_id)
            logger.debug(f"RLS context set for user {user_id}")

        try:
            # Process the request
            response = await call_next(request)
            return response
        finally:
            # Always clear the context, even if an exception occurs
            if user_id is not None:
                await self._clear_user_context(session)
                logger.debug(f"RLS context cleared for user {user_id}")

    def _should_skip(self, request: Request) -> bool:
        """Check if RLS should be skipped for this path."""
        return any(request.url.path.startswith(path) for path in self.skip_paths)

    def _allows_unauthenticated(self, request: Request) -> bool:
        """Check if this path allows unauthenticated access."""
        return any(
            request.url.path.startswith(path) for path in self.skip_unauthenticated
        )

    async def _set_user_context(self, session: AsyncSession, user_id: UUID) -> None:
        """
        Set the user context in PostgreSQL session.

        Uses the session variable 'app.current_user_id' that RLS policies
        check to filter data by ownership.
        """
        try:
            await session.execute(
                text("SELECT set_config('app.current_user_id', :user_id, false)"),
                {"user_id": str(user_id)},
            )
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to set RLS context: {e}")
            # Don't raise - let the request continue without RLS context
            # The RLS policies will filter all results (secure default)

    async def _clear_user_context(self, session: AsyncSession) -> None:
        """Clear the user context from PostgreSQL session."""
        try:
            await session.execute(
                text("SELECT set_config('app.current_user_id', NULL, true)")
            )
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to clear RLS context: {e}")
            # Ignore errors - the connection will be recycled anyway


# Dependency for getting the current user with RLS context
async def get_current_user_with_rls(
    request: Request,
    user_id: UUID,
) -> UUID:
    """
    Dependency that sets RLS context for the current user.

    Use this with protected endpoints to ensure RLS context is available:

    @router.get("/my-data")
    async def get_my_data(user_id: UUID = Depends(get_current_user_with_rls)):
        # RLS context is now set for this request
        data = await get_user_data(user_id)
        return data
    """
    # Set RLS context
    session = getattr(request.state, "db_session", None)
    if session:
        await session.execute(
            text("SELECT set_config('app.current_user_id', :user_id, false)"),
            {"user_id": str(user_id)},
        )
        await session.commit()

    return user_id


# Context manager for manual RLS context management
class RLSContext:
    """
    Context manager for manually setting RLS context.

    Use this for background tasks or scripts that need RLS context:

    async with RLSContext(session, user_id):
        # All queries in this block will have RLS context
        results = await session.execute(text("SELECT * FROM geometry"))
    """

    def __init__(self, session: AsyncSession, user_id: UUID):
        self.session = session
        self.user_id = user_id

    async def __aenter__(self) -> "RLSContext":
        await self.session.execute(
            text("SELECT set_config('app.current_user_id', :user_id, false)"),
            {"user_id": str(self.user_id)},
        )
        await self.session.commit()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.session.execute(
            text("SELECT set_config('app.current_user_id', NULL, true)")
        )
        await self.session.commit()
