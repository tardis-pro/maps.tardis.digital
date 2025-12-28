from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.users import fastapi_users
from app.core.security import auth_backend
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
