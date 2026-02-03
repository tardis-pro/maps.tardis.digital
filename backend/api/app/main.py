from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.users import fastapi_users
from app.core.security import auth_backend
from app.core.rate_limit import get_rate_limiter, rate_limit_exceeded_handler
from app.core.sentry import setup_sentry
from app.routes import (
    sources_router,
    layers_router,
    projects_router,
    geometry_router,
    users_router,
)
from app.schemas import UserRead, UserCreate

app = FastAPI(
    title="Maps Platform API",
    version="0.1.0",
    docs_url="/api/swagger",
    redoc_url="/api/redoc",
    openapi_url="/api/schema",
)

# Initialize Sentry
setup_sentry()

# Initialize rate limiter
limiter = get_rate_limiter()
app.state.limiter = limiter

# Add rate limit exception handler
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/api/v1/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/api/v1/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/api/v1/auth",
    tags=["auth"],
)

# API routes
app.include_router(sources_router)
app.include_router(layers_router)
app.include_router(projects_router)
app.include_router(geometry_router)
app.include_router(users_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Rate-limited health check
@app.get("/ready", tags=["health"])
@limiter.exempt  # Health checks are exempt from rate limiting
async def readiness_check():
    """Readiness probe endpoint."""
    return {"status": "ready"}
