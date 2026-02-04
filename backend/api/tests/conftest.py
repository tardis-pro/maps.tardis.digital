from typing import AsyncGenerator
import os

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db

# Use environment variable or default to localhost
POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "127.0.0.1")
TEST_DATABASE_URL = f"postgresql+asyncpg://postgres:postgres@{POSTGRES_HOST}:5432/maps_test"


@pytest.fixture
async def db_engine():
    """Create a fresh database engine for each test."""
    eng = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield eng
    await eng.dispose()


@pytest.fixture
async def setup_database(db_engine):
    """Set up database with PostGIS extensions and create tables."""
    async with db_engine.begin() as conn:
        await conn.execute(text("SET search_path TO public, topology"))
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def session_factory(db_engine):
    return async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture
async def db_session(setup_database, session_factory):
    """Get a database session."""
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(setup_database, session_factory):
    """Get a test client."""
    async def override_get_db():
        async with session_factory() as session:
            yield session
    
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
