# FastAPI + Rust Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Django REST API to FastAPI with Rust-accelerated hot paths while preserving API contract.

**Architecture:** Two FastAPI services (main API + ETL microservice) sharing a Rust PyO3 library (geo_engine) for compute-heavy operations. Async SQLAlchemy + GeoAlchemy2 for PostGIS access.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 (async), GeoAlchemy2, FastAPI-Users, Rust + PyO3, Alembic, pytest, Redis

---

## Phase 1: Project Scaffolding

### Task 1.1: Create API Project Structure

**Files:**
- Create: `api/pyproject.toml`
- Create: `api/app/__init__.py`
- Create: `api/app/main.py`
- Create: `api/app/config.py`

**Step 1: Create api directory and pyproject.toml**

```bash
mkdir -p backend/api/app
```

**Step 2: Write pyproject.toml**

Create `backend/api/pyproject.toml`:

```toml
[project]
name = "maps-api"
version = "0.1.0"
description = "Maps Platform API"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy[asyncio]>=2.0.25",
    "asyncpg>=0.29.0",
    "geoalchemy2>=0.14.3",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "fastapi-users[sqlalchemy]>=13.0.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "redis>=5.0.0",
    "httpx>=0.26.0",
    "shapely>=2.0.0",
    "geojson-pydantic>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.26.0",
    "deepdiff>=6.7.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

**Step 3: Write config.py**

Create `backend/api/app/config.py`:

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/maps"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # ETL Service
    ETL_SERVICE_URL: str = "http://localhost:8001"

    # Auth
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
```

**Step 4: Write main.py**

Create `backend/api/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

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


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**Step 5: Create __init__.py**

Create `backend/api/app/__init__.py`:

```python
# Maps Platform API
```

**Step 6: Commit**

```bash
git add backend/api/
git commit -m "feat(api): scaffold FastAPI project structure"
```

---

### Task 1.2: Create ETL Service Structure

**Files:**
- Create: `etl-service/pyproject.toml`
- Create: `etl-service/app/__init__.py`
- Create: `etl-service/app/main.py`
- Create: `etl-service/app/config.py`

**Step 1: Create directory structure**

```bash
mkdir -p backend/etl-service/app
```

**Step 2: Write pyproject.toml**

Create `backend/etl-service/pyproject.toml`:

```toml
[project]
name = "maps-etl-service"
version = "0.1.0"
description = "Maps Platform ETL Service"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy[asyncio]>=2.0.25",
    "asyncpg>=0.29.0",
    "geoalchemy2>=0.14.3",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "redis>=5.0.0",
    "python-multipart>=0.0.6",
    "aiofiles>=23.2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

**Step 3: Write config.py**

Create `backend/etl-service/app/config.py`:

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/maps"
    REDIS_URL: str = "redis://localhost:6379/0"
    UPLOAD_DIR: str = "/tmp/uploads"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
```

**Step 4: Write main.py**

Create `backend/etl-service/app/main.py`:

```python
from fastapi import FastAPI

from app.config import settings

app = FastAPI(
    title="Maps ETL Service",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**Step 5: Create __init__.py**

Create `backend/etl-service/app/__init__.py`:

```python
# Maps ETL Service
```

**Step 6: Commit**

```bash
git add backend/etl-service/
git commit -m "feat(etl): scaffold ETL service structure"
```

---

### Task 1.3: Create Rust Library Scaffold

**Files:**
- Create: `geo_engine/Cargo.toml`
- Create: `geo_engine/pyproject.toml`
- Create: `geo_engine/src/lib.rs`

**Step 1: Create directory**

```bash
mkdir -p backend/geo_engine/src
```

**Step 2: Write Cargo.toml**

Create `backend/geo_engine/Cargo.toml`:

```toml
[package]
name = "geo_engine"
version = "0.1.0"
edition = "2021"

[lib]
name = "geo_engine"
crate-type = ["cdylib"]

[dependencies]
pyo3 = { version = "0.21", features = ["extension-module"] }
geo = "0.28"
geojson = "0.24"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rayon = "1.10"
thiserror = "1.0"
wkb = "0.7"

[profile.release]
lto = true
codegen-units = 1
```

**Step 3: Write pyproject.toml for maturin**

Create `backend/geo_engine/pyproject.toml`:

```toml
[build-system]
requires = ["maturin>=1.4,<2.0"]
build-backend = "maturin"

[project]
name = "geo_engine"
version = "0.1.0"
description = "Rust-accelerated geometry operations"
requires-python = ">=3.11"
classifiers = [
    "Programming Language :: Rust",
    "Programming Language :: Python :: Implementation :: CPython",
]

[tool.maturin]
features = ["pyo3/extension-module"]
```

**Step 4: Write lib.rs**

Create `backend/geo_engine/src/lib.rs`:

```rust
use pyo3::prelude::*;

/// Formats the sum of two numbers as string.
#[pyfunction]
fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// A Python module implemented in Rust.
#[pymodule]
fn geo_engine(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(version, m)?)?;
    Ok(())
}
```

**Step 5: Commit**

```bash
git add backend/geo_engine/
git commit -m "feat(geo_engine): scaffold Rust library with PyO3"
```

---

## Phase 2: Database Layer

### Task 2.1: Create Database Connection

**Files:**
- Create: `api/app/core/__init__.py`
- Create: `api/app/core/database.py`

**Step 1: Create core directory**

```bash
mkdir -p backend/api/app/core
```

**Step 2: Write database.py**

Create `backend/api/app/core/database.py`:

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

**Step 3: Create __init__.py**

Create `backend/api/app/core/__init__.py`:

```python
from app.core.database import Base, engine, AsyncSessionLocal, get_db

__all__ = ["Base", "engine", "AsyncSessionLocal", "get_db"]
```

**Step 4: Commit**

```bash
git add backend/api/app/core/
git commit -m "feat(api): add async SQLAlchemy database connection"
```

---

### Task 2.2: Create SQLAlchemy Models

**Files:**
- Create: `api/app/models/__init__.py`
- Create: `api/app/models/source.py`
- Create: `api/app/models/geometry.py`
- Create: `api/app/models/layer.py`
- Create: `api/app/models/project.py`
- Create: `api/app/models/user.py`

**Step 1: Create models directory**

```bash
mkdir -p backend/api/app/models
```

**Step 2: Write source.py**

Create `backend/api/app/models/source.py`:

```python
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.geometry import Geometry
    from app.models.layer import Layer


class Source(Base):
    __tablename__ = "core_source"

    id: Mapped[int] = mapped_column(primary_key=True)
    sid: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), index=True)
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    geometries: Mapped[list["Geometry"]] = relationship(
        back_populates="source", cascade="all, delete-orphan"
    )
    layers: Mapped[list["Layer"]] = relationship(back_populates="source")
```

**Step 3: Write geometry.py**

Create `backend/api/app/models/geometry.py`:

```python
from typing import TYPE_CHECKING

from geoalchemy2 import Geometry as GeoAlchemyGeometry
from sqlalchemy import String, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.source import Source


class Geometry(Base):
    __tablename__ = "core_geometry"

    gid: Mapped[int] = mapped_column(primary_key=True)
    geom: Mapped[str] = mapped_column(
        GeoAlchemyGeometry(srid=4326, spatial_index=True)
    )
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    geometry_type: Mapped[str] = mapped_column(String(50), index=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("core_source.id"))

    source: Mapped["Source"] = relationship(back_populates="geometries")

    __table_args__ = (
        UniqueConstraint("gid", "source_id", name="unique_gid_source"),
    )
```

**Step 4: Write layer.py**

Create `backend/api/app/models/layer.py`:

```python
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, JSON, ForeignKey, DateTime, func, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.source import Source
    from app.models.project import Project

# Association table for Layer-Project many-to-many
layer_project = Table(
    "core_layer_projects",
    Base.metadata,
    Column("layer_id", Integer, ForeignKey("core_layer.id"), primary_key=True),
    Column("project_id", Integer, ForeignKey("core_project.id"), primary_key=True),
)


class Layer(Base):
    __tablename__ = "core_layer"

    id: Mapped[int] = mapped_column(primary_key=True)
    lid: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("core_source.id"))
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)
    style: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    source: Mapped["Source"] = relationship(back_populates="layers")
    projects: Mapped[list["Project"]] = relationship(
        secondary=layer_project, back_populates="layers"
    )
```

**Step 5: Write project.py**

Create `backend/api/app/models/project.py`:

```python
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.layer import layer_project

if TYPE_CHECKING:
    from app.models.layer import Layer


class Project(Base):
    __tablename__ = "core_project"

    id: Mapped[int] = mapped_column(primary_key=True)
    pid: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    project_type: Mapped[str] = mapped_column(String(50), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    layers: Mapped[list["Layer"]] = relationship(
        secondary=layer_project, back_populates="projects"
    )
```

**Step 6: Write user.py**

Create `backend/api/app/models/user.py`:

```python
from fastapi_users.db import SQLAlchemyBaseUserTable

from app.core.database import Base


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "auth_user"
```

**Step 7: Write models __init__.py**

Create `backend/api/app/models/__init__.py`:

```python
from app.models.source import Source
from app.models.geometry import Geometry
from app.models.layer import Layer, layer_project
from app.models.project import Project
from app.models.user import User

__all__ = ["Source", "Geometry", "Layer", "layer_project", "Project", "User"]
```

**Step 8: Commit**

```bash
git add backend/api/app/models/
git commit -m "feat(api): add SQLAlchemy + GeoAlchemy2 models"
```

---

### Task 2.3: Setup Alembic Migrations

**Files:**
- Create: `api/alembic.ini`
- Create: `api/alembic/env.py`
- Create: `api/alembic/script.py.mako`

**Step 1: Create alembic directory**

```bash
mkdir -p backend/api/alembic/versions
```

**Step 2: Write alembic.ini**

Create `backend/api/alembic.ini`:

```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

[post_write_hooks]

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

**Step 3: Write env.py**

Create `backend/api/alembic/env.py`:

```python
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.config import settings
from app.core.database import Base
from app.models import *  # noqa: Import all models

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

**Step 4: Write script.py.mako**

Create `backend/api/alembic/script.py.mako`:

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

**Step 5: Commit**

```bash
git add backend/api/alembic.ini backend/api/alembic/
git commit -m "feat(api): add Alembic migration configuration"
```

---

## Phase 3: Pydantic Schemas

### Task 3.1: Create Pydantic Schemas

**Files:**
- Create: `api/app/schemas/__init__.py`
- Create: `api/app/schemas/source.py`
- Create: `api/app/schemas/geometry.py`
- Create: `api/app/schemas/layer.py`
- Create: `api/app/schemas/project.py`
- Create: `api/app/schemas/user.py`
- Create: `api/app/schemas/common.py`

**Step 1: Create schemas directory**

```bash
mkdir -p backend/api/app/schemas
```

**Step 2: Write common.py**

Create `backend/api/app/schemas/common.py`:

```python
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    count: int
    next: str | None = None
    previous: str | None = None
    results: list[T]
```

**Step 3: Write source.py**

Create `backend/api/app/schemas/source.py`:

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SourceBase(BaseModel):
    sid: str
    name: str
    description: str | None = None
    source_type: str
    attributes: dict = {}


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    sid: str | None = None
    name: str | None = None
    description: str | None = None
    source_type: str | None = None
    attributes: dict | None = None


class SourceSchema(SourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
```

**Step 4: Write geometry.py**

Create `backend/api/app/schemas/geometry.py`:

```python
from typing import Any
from pydantic import BaseModel, ConfigDict
from geojson_pydantic import Feature, FeatureCollection, Geometry


class GeometryBase(BaseModel):
    geometry_type: str
    metadata_: dict = {}


class GeometryCreate(GeometryBase):
    geom: dict  # GeoJSON geometry
    source_id: int


class GeometrySchema(GeometryBase):
    model_config = ConfigDict(from_attributes=True)

    gid: int
    source_id: int


class GeoJSONFeature(Feature):
    pass


class GeoJSONFeatureCollection(FeatureCollection):
    pass
```

**Step 5: Write layer.py**

Create `backend/api/app/schemas/layer.py`:

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.source import SourceSchema


class LayerBase(BaseModel):
    lid: str
    name: str
    attributes: dict = {}
    style: dict = {}


class LayerCreate(LayerBase):
    source_id: int


class LayerUpdate(BaseModel):
    lid: str | None = None
    name: str | None = None
    attributes: dict | None = None
    style: dict | None = None
    source_id: int | None = None


class LayerSchema(LayerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: int
    source: SourceSchema | None = None
    created_at: datetime
    updated_at: datetime | None = None
```

**Step 6: Write project.py**

Create `backend/api/app/schemas/project.py`:

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.layer import LayerSchema


class ProjectBase(BaseModel):
    pid: str
    name: str
    description: str | None = None
    project_type: str


class ProjectCreate(ProjectBase):
    layer_ids: list[int] = []


class ProjectUpdate(BaseModel):
    pid: str | None = None
    name: str | None = None
    description: str | None = None
    project_type: str | None = None
    layer_ids: list[int] | None = None


class ProjectSchema(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    layers: list[LayerSchema] = []
    created_at: datetime
    updated_at: datetime | None = None
```

**Step 7: Write user.py**

Create `backend/api/app/schemas/user.py`:

```python
from fastapi_users import schemas


class UserRead(schemas.BaseUser[int]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass
```

**Step 8: Write schemas __init__.py**

Create `backend/api/app/schemas/__init__.py`:

```python
from app.schemas.common import PaginatedResponse
from app.schemas.source import SourceBase, SourceCreate, SourceUpdate, SourceSchema
from app.schemas.geometry import (
    GeometryBase,
    GeometryCreate,
    GeometrySchema,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
)
from app.schemas.layer import LayerBase, LayerCreate, LayerUpdate, LayerSchema
from app.schemas.project import ProjectBase, ProjectCreate, ProjectUpdate, ProjectSchema
from app.schemas.user import UserRead, UserCreate, UserUpdate

__all__ = [
    "PaginatedResponse",
    "SourceBase",
    "SourceCreate",
    "SourceUpdate",
    "SourceSchema",
    "GeometryBase",
    "GeometryCreate",
    "GeometrySchema",
    "GeoJSONFeature",
    "GeoJSONFeatureCollection",
    "LayerBase",
    "LayerCreate",
    "LayerUpdate",
    "LayerSchema",
    "ProjectBase",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectSchema",
    "UserRead",
    "UserCreate",
    "UserUpdate",
]
```

**Step 9: Commit**

```bash
git add backend/api/app/schemas/
git commit -m "feat(api): add Pydantic schemas for API request/response"
```

---

## Phase 4: Authentication

### Task 4.1: Setup FastAPI-Users

**Files:**
- Create: `api/app/core/security.py`
- Create: `api/app/core/users.py`
- Modify: `api/app/core/__init__.py`

**Step 1: Write security.py**

Create `backend/api/app/core/security.py`:

```python
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)

from app.config import settings

bearer_transport = BearerTransport(tokenUrl="/api/v1/auth/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.SECRET_KEY,
        lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)
```

**Step 2: Write users.py**

Create `backend/api/app/core/users.py`:

```python
from typing import AsyncGenerator

from fastapi import Depends
from fastapi_users import FastAPIUsers, BaseUserManager, IntegerIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.security import auth_backend
from app.models.user import User


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY


async def get_user_db(
    session: AsyncSession = Depends(get_db),
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User)


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase = Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


fastapi_users = FastAPIUsers[User, int](
    get_user_manager,
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)
current_optional_user = fastapi_users.current_user(active=True, optional=True)
```

**Step 3: Update core __init__.py**

Update `backend/api/app/core/__init__.py`:

```python
from app.core.database import Base, engine, AsyncSessionLocal, get_db
from app.core.security import auth_backend
from app.core.users import (
    fastapi_users,
    current_active_user,
    current_optional_user,
    get_user_manager,
)

__all__ = [
    "Base",
    "engine",
    "AsyncSessionLocal",
    "get_db",
    "auth_backend",
    "fastapi_users",
    "current_active_user",
    "current_optional_user",
    "get_user_manager",
]
```

**Step 4: Commit**

```bash
git add backend/api/app/core/
git commit -m "feat(api): add FastAPI-Users authentication"
```

---

## Phase 5: API Routes

### Task 5.1: Create Source Routes

**Files:**
- Create: `api/app/routes/__init__.py`
- Create: `api/app/routes/sources.py`

**Step 1: Create routes directory**

```bash
mkdir -p backend/api/app/routes
```

**Step 2: Write sources.py**

Create `backend/api/app/routes/sources.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.users import current_active_user
from app.models import Source, User
from app.schemas import SourceCreate, SourceUpdate, SourceSchema, PaginatedResponse

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


@router.get("/", response_model=PaginatedResponse[SourceSchema])
async def list_sources(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    offset = (page - 1) * page_size

    count_stmt = select(func.count()).select_from(Source)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()

    stmt = select(Source).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    sources = result.scalars().all()

    return {
        "count": total,
        "next": None,
        "previous": None,
        "results": sources,
    }


@router.post("/", response_model=SourceSchema, status_code=201)
async def create_source(
    payload: SourceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = Source(**payload.model_dump())
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


@router.get("/{source_id}/", response_model=SourceSchema)
async def get_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.put("/{source_id}/", response_model=SourceSchema)
async def update_source(
    source_id: int,
    payload: SourceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    for key, value in payload.model_dump().items():
        setattr(source, key, value)

    await db.commit()
    await db.refresh(source)
    return source


@router.patch("/{source_id}/", response_model=SourceSchema)
async def partial_update_source(
    source_id: int,
    payload: SourceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(source, key, value)

    await db.commit()
    await db.refresh(source)
    return source


@router.delete("/{source_id}/", status_code=204)
async def delete_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    source = await db.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    await db.delete(source)
    await db.commit()
```

**Step 3: Commit**

```bash
git add backend/api/app/routes/sources.py
git commit -m "feat(api): add source CRUD endpoints"
```

---

### Task 5.2: Create Layer Routes

**Files:**
- Create: `api/app/routes/layers.py`

**Step 1: Write layers.py**

Create `backend/api/app/routes/layers.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.users import current_active_user
from app.models import Layer, Source, User
from app.schemas import LayerCreate, LayerUpdate, LayerSchema, PaginatedResponse

router = APIRouter(prefix="/api/v1/layers", tags=["layers"])


@router.get("/", response_model=PaginatedResponse[LayerSchema])
async def list_layers(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    offset = (page - 1) * page_size

    count_stmt = select(func.count()).select_from(Layer)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()

    stmt = (
        select(Layer)
        .options(selectinload(Layer.source))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    layers = result.scalars().all()

    return {
        "count": total,
        "next": None,
        "previous": None,
        "results": layers,
    }


@router.post("/", response_model=LayerSchema, status_code=201)
async def create_layer(
    payload: LayerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    # Verify source exists
    source = await db.get(Source, payload.source_id)
    if not source:
        raise HTTPException(status_code=400, detail="Source not found")

    layer = Layer(**payload.model_dump())
    db.add(layer)
    await db.commit()
    await db.refresh(layer)
    return layer


@router.get("/{layer_id}/", response_model=LayerSchema)
async def get_layer(
    layer_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Layer)
        .options(selectinload(Layer.source))
        .where(Layer.id == layer_id)
    )
    result = await db.execute(stmt)
    layer = result.scalar_one_or_none()

    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    return layer


@router.put("/{layer_id}/", response_model=LayerSchema)
async def update_layer(
    layer_id: int,
    payload: LayerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    layer = await db.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")

    for key, value in payload.model_dump().items():
        setattr(layer, key, value)

    await db.commit()
    await db.refresh(layer)
    return layer


@router.patch("/{layer_id}/", response_model=LayerSchema)
async def partial_update_layer(
    layer_id: int,
    payload: LayerUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    layer = await db.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(layer, key, value)

    await db.commit()
    await db.refresh(layer)
    return layer


@router.delete("/{layer_id}/", status_code=204)
async def delete_layer(
    layer_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    layer = await db.get(Layer, layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")

    await db.delete(layer)
    await db.commit()
```

**Step 2: Commit**

```bash
git add backend/api/app/routes/layers.py
git commit -m "feat(api): add layer CRUD endpoints"
```

---

### Task 5.3: Create Project Routes

**Files:**
- Create: `api/app/routes/projects.py`

**Step 1: Write projects.py**

Create `backend/api/app/routes/projects.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.users import current_active_user
from app.models import Project, Layer, User
from app.schemas import ProjectCreate, ProjectUpdate, ProjectSchema, PaginatedResponse

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.get("/", response_model=PaginatedResponse[ProjectSchema])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    offset = (page - 1) * page_size

    count_stmt = select(func.count()).select_from(Project)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()

    stmt = (
        select(Project)
        .options(selectinload(Project.layers).selectinload(Layer.source))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    projects = result.scalars().all()

    return {
        "count": total,
        "next": None,
        "previous": None,
        "results": projects,
    }


@router.post("/", response_model=ProjectSchema, status_code=201)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    data = payload.model_dump(exclude={"layer_ids"})
    project = Project(**data)

    if payload.layer_ids:
        stmt = select(Layer).where(Layer.id.in_(payload.layer_ids))
        result = await db.execute(stmt)
        layers = result.scalars().all()
        project.layers = list(layers)

    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}/", response_model=ProjectSchema)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Project)
        .options(selectinload(Project.layers).selectinload(Layer.source))
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}/", response_model=ProjectSchema)
async def update_project(
    project_id: int,
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    data = payload.model_dump(exclude={"layer_ids"})
    for key, value in data.items():
        setattr(project, key, value)

    if payload.layer_ids is not None:
        stmt = select(Layer).where(Layer.id.in_(payload.layer_ids))
        result = await db.execute(stmt)
        layers = result.scalars().all()
        project.layers = list(layers)

    await db.commit()
    await db.refresh(project)
    return project


@router.patch("/{project_id}/", response_model=ProjectSchema)
async def partial_update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    data = payload.model_dump(exclude_unset=True, exclude={"layer_ids"})
    for key, value in data.items():
        setattr(project, key, value)

    if payload.layer_ids is not None:
        stmt = select(Layer).where(Layer.id.in_(payload.layer_ids))
        result = await db.execute(stmt)
        layers = result.scalars().all()
        project.layers = list(layers)

    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}/", status_code=204)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(current_active_user),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)
    await db.commit()
```

**Step 2: Commit**

```bash
git add backend/api/app/routes/projects.py
git commit -m "feat(api): add project CRUD endpoints"
```

---

### Task 5.4: Create Geometry/WFS Routes

**Files:**
- Create: `api/app/routes/geometry.py`

**Step 1: Write geometry.py**

Create `backend/api/app/routes/geometry.py`:

```python
from typing import Any

from fastapi import APIRouter, Depends, Query
from geoalchemy2.functions import ST_AsGeoJSON, ST_Intersects, ST_MakeEnvelope
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Geometry

router = APIRouter(prefix="/api/v1/wfs", tags=["wfs"])


@router.get("/")
async def get_geometries(
    db: AsyncSession = Depends(get_db),
    bbox: str | None = Query(None, description="Bounding box: minx,miny,maxx,maxy"),
    source_id: int | None = Query(None),
    limit: int = Query(1000, ge=1, le=10000),
) -> dict[str, Any]:
    """Get geometries as GeoJSON FeatureCollection."""

    stmt = select(
        Geometry.gid,
        Geometry.metadata_,
        Geometry.geometry_type,
        Geometry.source_id,
        ST_AsGeoJSON(Geometry.geom).label("geojson"),
    )

    if bbox:
        coords = [float(c) for c in bbox.split(",")]
        if len(coords) == 4:
            minx, miny, maxx, maxy = coords
            envelope = ST_MakeEnvelope(minx, miny, maxx, maxy, 4326)
            stmt = stmt.where(ST_Intersects(Geometry.geom, envelope))

    if source_id:
        stmt = stmt.where(Geometry.source_id == source_id)

    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    rows = result.all()

    features = []
    for row in rows:
        import json
        geom = json.loads(row.geojson)
        feature = {
            "type": "Feature",
            "id": row.gid,
            "geometry": geom,
            "properties": {
                **row.metadata_,
                "geometry_type": row.geometry_type,
                "source_id": row.source_id,
            },
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features,
    }
```

**Step 2: Commit**

```bash
git add backend/api/app/routes/geometry.py
git commit -m "feat(api): add WFS/geometry endpoint"
```

---

### Task 5.5: Create User Profile Routes

**Files:**
- Create: `api/app/routes/users.py`

**Step 1: Write users.py**

Create `backend/api/app/routes/users.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.users import current_active_user
from app.models import User
from app.schemas import UserRead, UserUpdate

router = APIRouter(prefix="/api/v1/user-profile", tags=["users"])


@router.get("/", response_model=UserRead)
async def get_user_profile(
    user: User = Depends(current_active_user),
):
    return user


@router.put("/", response_model=UserRead)
async def update_user_profile(
    payload: UserUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    for key, value in payload.model_dump(exclude_unset=True).items():
        if hasattr(user, key):
            setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/", response_model=UserRead)
async def partial_update_user_profile(
    payload: UserUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
):
    for key, value in payload.model_dump(exclude_unset=True).items():
        if hasattr(user, key):
            setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user
```

**Step 2: Commit**

```bash
git add backend/api/app/routes/users.py
git commit -m "feat(api): add user profile endpoints"
```

---

### Task 5.6: Wire Up All Routes

**Files:**
- Create: `api/app/routes/__init__.py`
- Modify: `api/app/main.py`

**Step 1: Write routes __init__.py**

Create `backend/api/app/routes/__init__.py`:

```python
from app.routes.sources import router as sources_router
from app.routes.layers import router as layers_router
from app.routes.projects import router as projects_router
from app.routes.geometry import router as geometry_router
from app.routes.users import router as users_router

__all__ = [
    "sources_router",
    "layers_router",
    "projects_router",
    "geometry_router",
    "users_router",
]
```

**Step 2: Update main.py**

Replace `backend/api/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core import fastapi_users, auth_backend
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
```

**Step 3: Commit**

```bash
git add backend/api/app/routes/__init__.py backend/api/app/main.py
git commit -m "feat(api): wire up all API routes"
```

---

## Phase 6: Rust Library Implementation

### Task 6.1: Implement Geometry Parsing

**Files:**
- Create: `geo_engine/src/geometry/mod.rs`
- Create: `geo_engine/src/geometry/parser.rs`
- Modify: `geo_engine/src/lib.rs`

**Step 1: Create geometry module directory**

```bash
mkdir -p backend/geo_engine/src/geometry
```

**Step 2: Write parser.rs**

Create `backend/geo_engine/src/geometry/parser.rs`:

```rust
use geo::Geometry;
use geojson::{Feature, FeatureCollection, GeoJson};
use pyo3::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct ParsedFeature {
    pub geometry: String,      // WKT or GeoJSON string
    pub properties: String,    // JSON string of properties
    pub geom_type: String,
}

#[pyfunction]
pub fn parse_geojson_file(path: &str) -> PyResult<Vec<ParsedFeature>> {
    let content = fs::read_to_string(path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

    parse_geojson_string(&content)
}

#[pyfunction]
pub fn parse_geojson_string(content: &str) -> PyResult<Vec<ParsedFeature>> {
    let geojson: GeoJson = content
        .parse()
        .map_err(|e: geojson::Error| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

    let features = match geojson {
        GeoJson::FeatureCollection(fc) => fc.features,
        GeoJson::Feature(f) => vec![f],
        GeoJson::Geometry(g) => {
            vec![Feature {
                geometry: Some(g),
                properties: None,
                id: None,
                bbox: None,
                foreign_members: None,
            }]
        }
    };

    let mut parsed = Vec::with_capacity(features.len());

    for feature in features {
        if let Some(geom) = feature.geometry {
            let geom_type = match &geom.value {
                geojson::Value::Point(_) => "Point",
                geojson::Value::MultiPoint(_) => "MultiPoint",
                geojson::Value::LineString(_) => "LineString",
                geojson::Value::MultiLineString(_) => "MultiLineString",
                geojson::Value::Polygon(_) => "Polygon",
                geojson::Value::MultiPolygon(_) => "MultiPolygon",
                geojson::Value::GeometryCollection(_) => "GeometryCollection",
            };

            let props = feature
                .properties
                .map(|p| serde_json::to_string(&p).unwrap_or_default())
                .unwrap_or_else(|| "{}".to_string());

            parsed.push(ParsedFeature {
                geometry: geom.to_string(),
                properties: props,
                geom_type: geom_type.to_string(),
            });
        }
    }

    Ok(parsed)
}
```

**Step 3: Write geometry mod.rs**

Create `backend/geo_engine/src/geometry/mod.rs`:

```rust
pub mod parser;

pub use parser::{parse_geojson_file, parse_geojson_string, ParsedFeature};
```

**Step 4: Update lib.rs**

Replace `backend/geo_engine/src/lib.rs`:

```rust
use pyo3::prelude::*;

mod geometry;

use geometry::{parse_geojson_file, parse_geojson_string};

#[pyfunction]
fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[pymodule]
fn geo_engine(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(version, m)?)?;
    m.add_function(wrap_pyfunction!(parse_geojson_file, m)?)?;
    m.add_function(wrap_pyfunction!(parse_geojson_string, m)?)?;
    Ok(())
}
```

**Step 5: Commit**

```bash
git add backend/geo_engine/
git commit -m "feat(geo_engine): add GeoJSON parsing"
```

---

### Task 6.2: Implement Bulk Import Streaming

**Files:**
- Create: `geo_engine/src/import/mod.rs`
- Create: `geo_engine/src/import/csv.rs`
- Modify: `geo_engine/src/lib.rs`

**Step 1: Create import module directory**

```bash
mkdir -p backend/geo_engine/src/import
```

**Step 2: Write csv.rs**

Create `backend/geo_engine/src/import/csv.rs`:

```rust
use pyo3::prelude::*;
use rayon::prelude::*;
use serde_json::json;
use std::fs::File;
use std::io::{BufRead, BufReader};

#[derive(Debug)]
pub struct PointRecord {
    pub lon: f64,
    pub lat: f64,
    pub properties: String,
}

#[pyclass]
#[derive(Debug)]
pub struct CsvPointBatch {
    #[pyo3(get)]
    pub points: Vec<(f64, f64, String)>, // (lon, lat, properties_json)
}

#[pyfunction]
pub fn stream_csv_points(
    path: &str,
    lon_col: &str,
    lat_col: &str,
    chunk_size: usize,
) -> PyResult<Vec<CsvPointBatch>> {
    let file = File::open(path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    let reader = BufReader::new(file);
    let mut lines = reader.lines();

    // Parse header
    let header = lines
        .next()
        .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyValueError, _>("Empty CSV file"))?
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

    let columns: Vec<&str> = header.split(',').collect();
    let lon_idx = columns
        .iter()
        .position(|&c| c.trim() == lon_col)
        .ok_or_else(|| {
            PyErr::new::<pyo3::exceptions::PyValueError, _>(format!(
                "Column '{}' not found",
                lon_col
            ))
        })?;
    let lat_idx = columns
        .iter()
        .position(|&c| c.trim() == lat_col)
        .ok_or_else(|| {
            PyErr::new::<pyo3::exceptions::PyValueError, _>(format!(
                "Column '{}' not found",
                lat_col
            ))
        })?;

    // Collect all lines for parallel processing
    let all_lines: Vec<String> = lines.filter_map(|l| l.ok()).collect();

    // Process in parallel
    let records: Vec<(f64, f64, String)> = all_lines
        .par_iter()
        .filter_map(|line| {
            let fields: Vec<&str> = line.split(',').collect();
            if fields.len() <= lon_idx.max(lat_idx) {
                return None;
            }

            let lon: f64 = fields[lon_idx].trim().parse().ok()?;
            let lat: f64 = fields[lat_idx].trim().parse().ok()?;

            // Build properties from all columns except lat/lon
            let mut props = serde_json::Map::new();
            for (i, col) in columns.iter().enumerate() {
                if i != lon_idx && i != lat_idx && i < fields.len() {
                    props.insert(
                        col.trim().to_string(),
                        serde_json::Value::String(fields[i].trim().to_string()),
                    );
                }
            }

            Some((lon, lat, serde_json::to_string(&props).unwrap_or_default()))
        })
        .collect();

    // Chunk into batches
    let batches: Vec<CsvPointBatch> = records
        .chunks(chunk_size)
        .map(|chunk| CsvPointBatch {
            points: chunk.to_vec(),
        })
        .collect();

    Ok(batches)
}
```

**Step 3: Write import mod.rs**

Create `backend/geo_engine/src/import/mod.rs`:

```rust
pub mod csv;

pub use csv::{stream_csv_points, CsvPointBatch};
```

**Step 4: Update lib.rs**

Replace `backend/geo_engine/src/lib.rs`:

```rust
use pyo3::prelude::*;

mod geometry;
mod import;

use geometry::{parse_geojson_file, parse_geojson_string};
use import::{stream_csv_points, CsvPointBatch};

#[pyfunction]
fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[pymodule]
fn geo_engine(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(version, m)?)?;

    // Geometry
    m.add_function(wrap_pyfunction!(parse_geojson_file, m)?)?;
    m.add_function(wrap_pyfunction!(parse_geojson_string, m)?)?;

    // Import
    m.add_function(wrap_pyfunction!(stream_csv_points, m)?)?;
    m.add_class::<CsvPointBatch>()?;

    Ok(())
}
```

**Step 5: Commit**

```bash
git add backend/geo_engine/
git commit -m "feat(geo_engine): add CSV point streaming import"
```

---

## Phase 7: ETL Service Implementation

### Task 7.1: Create ETL Database Connection

**Files:**
- Create: `etl-service/app/core/__init__.py`
- Create: `etl-service/app/core/database.py`

**Step 1: Create core directory**

```bash
mkdir -p backend/etl-service/app/core
```

**Step 2: Write database.py**

Create `backend/etl-service/app/core/database.py`:

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

**Step 3: Create __init__.py**

Create `backend/etl-service/app/core/__init__.py`:

```python
from app.core.database import Base, engine, AsyncSessionLocal, get_db

__all__ = ["Base", "engine", "AsyncSessionLocal", "get_db"]
```

**Step 4: Commit**

```bash
git add backend/etl-service/app/core/
git commit -m "feat(etl): add database connection"
```

---

### Task 7.2: Create ETL Task Models

**Files:**
- Create: `etl-service/app/models/__init__.py`
- Create: `etl-service/app/models/task.py`

**Step 1: Create models directory**

```bash
mkdir -p backend/etl-service/app/models
```

**Step 2: Write task.py**

Create `backend/etl-service/app/models/task.py`:

```python
from datetime import datetime
from enum import Enum

from sqlalchemy import String, Text, JSON, DateTime, func, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Task(Base):
    __tablename__ = "etl_task"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_type: Mapped[str] = mapped_column(String(50), index=True)
    status: Mapped[str] = mapped_column(String(20), default=TaskStatus.PENDING)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    params: Mapped[dict] = mapped_column(JSON, default=dict)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
```

**Step 3: Write models __init__.py**

Create `backend/etl-service/app/models/__init__.py`:

```python
from app.models.task import Task, TaskStatus

__all__ = ["Task", "TaskStatus"]
```

**Step 4: Commit**

```bash
git add backend/etl-service/app/models/
git commit -m "feat(etl): add task model"
```

---

### Task 7.3: Create ETL Task Routes

**Files:**
- Create: `etl-service/app/routes/__init__.py`
- Create: `etl-service/app/routes/tasks.py`
- Modify: `etl-service/app/main.py`

**Step 1: Create routes directory**

```bash
mkdir -p backend/etl-service/app/routes
```

**Step 2: Write tasks.py**

Create `backend/etl-service/app/routes/tasks.py`:

```python
import os
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.config import settings
from app.core.database import get_db
from app.models import Task, TaskStatus

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskResponse(BaseModel):
    id: int
    task_type: str
    status: str
    progress: int
    params: dict
    result: dict | None
    error: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    class Config:
        from_attributes = True


async def save_upload(file: UploadFile) -> str:
    """Save uploaded file and return path."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    path = os.path.join(settings.UPLOAD_DIR, file.filename)

    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return path


@router.post("/import/shapefile", response_model=TaskResponse)
async def import_shapefile(
    file: UploadFile,
    source_name: str = Form(...),
    source_type: str = Form("vector"),
    srid: int = Form(4326),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = None,
):
    file_path = await save_upload(file)

    task = Task(
        task_type="shapefile_import",
        status=TaskStatus.PENDING,
        params={
            "file_path": file_path,
            "source_name": source_name,
            "source_type": source_type,
            "srid": srid,
        },
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # TODO: Add background task processing

    return task


@router.post("/import/csv", response_model=TaskResponse)
async def import_csv(
    file: UploadFile,
    source_name: str = Form(...),
    lon_col: str = Form("longitude"),
    lat_col: str = Form("latitude"),
    db: AsyncSession = Depends(get_db),
):
    file_path = await save_upload(file)

    task = Task(
        task_type="csv_import",
        status=TaskStatus.PENDING,
        params={
            "file_path": file_path,
            "source_name": source_name,
            "lon_col": lon_col,
            "lat_col": lat_col,
        },
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return task


@router.post("/import/geojson", response_model=TaskResponse)
async def import_geojson(
    file: UploadFile,
    source_name: str = Form(...),
    source_type: str = Form("vector"),
    db: AsyncSession = Depends(get_db),
):
    file_path = await save_upload(file)

    task = Task(
        task_type="geojson_import",
        status=TaskStatus.PENDING,
        params={
            "file_path": file_path,
            "source_name": source_name,
            "source_type": source_type,
        },
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
```

**Step 3: Write routes __init__.py**

Create `backend/etl-service/app/routes/__init__.py`:

```python
from app.routes.tasks import router as tasks_router

__all__ = ["tasks_router"]
```

**Step 4: Update main.py**

Replace `backend/etl-service/app/main.py`:

```python
from fastapi import FastAPI

from app.config import settings
from app.routes import tasks_router

app = FastAPI(
    title="Maps ETL Service",
    version="0.1.0",
)

app.include_router(tasks_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**Step 5: Commit**

```bash
git add backend/etl-service/app/routes/ backend/etl-service/app/main.py
git commit -m "feat(etl): add task import endpoints"
```

---

## Phase 8: Docker Configuration

### Task 8.1: Create Dockerfiles

**Files:**
- Create: `api/Dockerfile`
- Create: `etl-service/Dockerfile`
- Modify: `docker-compose.yml`

**Step 1: Write API Dockerfile**

Create `backend/api/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Copy application
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 2: Write ETL Service Dockerfile**

Create `backend/etl-service/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Copy application
COPY app/ ./app/

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Step 3: Update docker-compose.yml**

Replace `backend/docker-compose.yml`:

```yaml
version: "3.8"

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/maps
      - REDIS_URL=redis://redis:6379/0
      - ETL_SERVICE_URL=http://etl-service:8001
      - SECRET_KEY=${SECRET_KEY:-change-me-in-production}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./api/app:/app/app:ro
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  etl-service:
    build:
      context: ./etl-service
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/maps
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    volumes:
      - ./etl-service/app:/app/app:ro
      - upload-data:/app/uploads
    command: uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

  postgres:
    image: postgis/postgis:14-3.3
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=maps
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  martin:
    image: ghcr.io/maplibre/martin:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/maps
    depends_on:
      - postgres

  titiler:
    image: ghcr.io/developmentseed/titiler:latest
    ports:
      - "9000:8000"
    volumes:
      - raster-data:/data

volumes:
  postgres-data:
  upload-data:
  raster-data:
```

**Step 4: Commit**

```bash
git add backend/api/Dockerfile backend/etl-service/Dockerfile backend/docker-compose.yml
git commit -m "feat: add Docker configuration for FastAPI services"
```

---

## Phase 9: Testing

### Task 9.1: Create Test Infrastructure

**Files:**
- Create: `api/tests/__init__.py`
- Create: `api/tests/conftest.py`

**Step 1: Create tests directory**

```bash
mkdir -p backend/api/tests
```

**Step 2: Write conftest.py**

Create `backend/api/tests/conftest.py`:

```python
import asyncio
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/maps_test"

engine = create_async_engine(TEST_DATABASE_URL, echo=True)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(setup_database) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session(setup_database) -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
```

**Step 3: Create __init__.py**

Create `backend/api/tests/__init__.py`:

```python
# Maps API Tests
```

**Step 4: Commit**

```bash
git add backend/api/tests/
git commit -m "test(api): add test infrastructure"
```

---

### Task 9.2: Create Source Endpoint Tests

**Files:**
- Create: `api/tests/test_sources.py`

**Step 1: Write test_sources.py**

Create `backend/api/tests/test_sources.py`:

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_sources_empty(client: AsyncClient):
    response = await client.get("/api/v1/sources/")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "count" in data


@pytest.mark.asyncio
async def test_create_source_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/v1/sources/",
        json={
            "sid": "test-source",
            "name": "Test Source",
            "source_type": "vector",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_source_not_found(client: AsyncClient):
    response = await client.get("/api/v1/sources/99999/")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
```

**Step 2: Commit**

```bash
git add backend/api/tests/test_sources.py
git commit -m "test(api): add source endpoint tests"
```

---

## Phase 10: Final Integration

### Task 10.1: Create .env.example

**Files:**
- Create: `api/.env.example`
- Create: `etl-service/.env.example`

**Step 1: Write API .env.example**

Create `backend/api/.env.example`:

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/maps
REDIS_URL=redis://localhost:6379/0
ETL_SERVICE_URL=http://localhost:8001
SECRET_KEY=change-me-in-production
DEBUG=true
```

**Step 2: Write ETL Service .env.example**

Create `backend/etl-service/.env.example`:

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/maps
REDIS_URL=redis://localhost:6379/0
UPLOAD_DIR=/tmp/uploads
DEBUG=true
```

**Step 3: Commit**

```bash
git add backend/api/.env.example backend/etl-service/.env.example
git commit -m "docs: add .env.example files"
```

---

### Task 10.2: Update Backend README

**Files:**
- Modify: `backend/README.md`

**Step 1: Update README.md**

Replace `backend/README.md`:

```markdown
# Maps Platform Backend

FastAPI-based geospatial API with Rust-accelerated operations.

## Architecture

- **api/** - Main FastAPI REST API (port 8000)
- **etl-service/** - Import/analysis microservice (port 8001)
- **geo_engine/** - Rust library for compute-heavy operations

## Quick Start

```bash
# Start all services
docker-compose up -d

# API: http://localhost:8000
# ETL: http://localhost:8001
# Swagger: http://localhost:8000/api/swagger
```

## Development

### API Service

```bash
cd api
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### ETL Service

```bash
cd etl-service
pip install -e ".[dev]"
uvicorn app.main:app --port 8001 --reload
```

### Rust Library

```bash
cd geo_engine
maturin develop
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | /api/v1/sources/ | List/create sources |
| GET/PUT/PATCH/DELETE | /api/v1/sources/{id}/ | Source detail |
| GET/POST | /api/v1/layers/ | List/create layers |
| GET/PUT/PATCH/DELETE | /api/v1/layers/{id}/ | Layer detail |
| GET/POST | /api/v1/projects/ | List/create projects |
| GET/PUT/PATCH/DELETE | /api/v1/projects/{id}/ | Project detail |
| GET | /api/v1/wfs/ | GeoJSON geometries |
| GET/PUT/PATCH | /api/v1/user-profile/ | User profile |
| POST | /api/v1/auth/login | JWT login |
| POST | /api/v1/auth/register | User registration |

## Testing

```bash
cd api
pytest
```
```

**Step 2: Commit**

```bash
git add backend/README.md
git commit -m "docs: update README for FastAPI migration"
```

---

### Task 10.3: Final Verification

**Step 1: Run linting (if available)**

```bash
cd backend/api && python -m py_compile app/main.py app/config.py
```

**Step 2: Verify Rust compiles**

```bash
cd backend/geo_engine && cargo check
```

**Step 3: Final commit with summary**

```bash
git add -A
git commit -m "feat: complete FastAPI + Rust migration scaffold

- FastAPI main API with async SQLAlchemy + GeoAlchemy2
- FastAPI-Users for JWT authentication
- ETL microservice for import tasks
- Rust geo_engine library with GeoJSON parsing and CSV import
- Docker configuration for all services
- Test infrastructure with pytest-asyncio
- Preserved API contract from Django"
```

---

## Summary

This plan creates:

1. **api/** - FastAPI service with:
   - Async SQLAlchemy + GeoAlchemy2 models
   - FastAPI-Users JWT authentication
   - All CRUD endpoints matching Django API contract
   - Alembic migrations

2. **etl-service/** - ETL microservice with:
   - Task queue for imports
   - Shapefile/CSV/GeoJSON import endpoints

3. **geo_engine/** - Rust library with:
   - GeoJSON parsing
   - CSV point streaming
   - PyO3 bindings

4. **Docker** - Updated compose with new services

**Total Tasks:** 23
**Estimated commits:** 23
