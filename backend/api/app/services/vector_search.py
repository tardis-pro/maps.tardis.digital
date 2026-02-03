"""
Semantic Vector Search with pgvector

This module implements semantic search capabilities using pgvector extension
for PostgreSQL. It allows searching by semantic similarity rather than
exact text matches.

Requirements:
- PostgreSQL with pgvector extension installed
- OpenAI API key for text embeddings (or alternative embedding provider)
"""

import logging
from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Source, Layer, Geometry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/semantic-search", tags=["semantic-search"])

# Embedding dimension (OpenAI text-embedding-3-small)
EMBEDDING_DIMENSION = 1536


# ============ Pydantic Models ============

class EmbeddingSearchQuery(BaseModel):
    """Request model for semantic search."""

    query: str = Field(..., description="Natural language search query")
    source_id: Optional[int] = Field(None, description="Limit search to specific source")
    top_k: int = Field(default=5, ge=1, le=50, description="Number of results to return")
    similarity_threshold: float = Field(
        default=0.5, ge=0.0, max=1.0, description="Minimum similarity score"
    )


class SearchResult(BaseModel):
    """Individual search result."""

    id: int
    type: str  # 'source', 'layer', 'geometry'
    title: Optional[str] = None
    description: Optional[str] = None
    similarity_score: float
    metadata: dict = {}


class SearchResponse(BaseModel):
    """Search response with results."""

    query: str
    results: list[SearchResult]
    total_count: int
    search_time_ms: float


class EmbeddingCreate(BaseModel):
    """Request to create embeddings for an entity."""

    entity_type: str = Field(..., description="'source', 'layer', or 'geometry'")
    entity_id: int = Field(..., description="Entity ID to embed")
    text_content: str = Field(..., description="Text to embed")


class EmbeddingResponse(BaseModel):
    """Response after creating embeddings."""

    entity_type: str
    entity_id: int
    embedding_id: int
    created_at: datetime
    dimension: int


# ============ Helper Functions ============

async def get_embedding(
    db: AsyncSession,
    entity_type: str,
    entity_id: int,
) -> Optional[list[float]]:
    """Get existing embedding for an entity."""
    table_map = {
        'source': 'source_embeddings',
        'layer': 'layer_embeddings',
        'geometry': 'geometry_embeddings',
    }
    table = table_map.get(entity_type)

    if not table:
        raise ValueError(f"Unknown entity type: {entity_type}")

    result = await db.execute(
        text(f"""
            SELECT embedding
            FROM {table}
            WHERE {entity_type}_id = :entity_id
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {'entity_id': entity_id},
    )
    row = result.fetchone()
    return row[0] if row else None


async def create_embedding(
    db: AsyncSession,
    entity_type: str,
    entity_id: int,
    embedding: list[float],
) -> int:
    """Create a new embedding for an entity."""
    table_map = {
        'source': 'source_embeddings',
        'layer': 'layer_embeddings',
        'geometry': 'geometry_embeddings',
    }
    table = table_map.get(entity_type)

    if not table:
        raise ValueError(f"Unknown entity type: {entity_type}")

    result = await db.execute(
        text(f"""
            INSERT INTO {table} ({entity_type}_id, embedding, created_at)
            VALUES (:entity_id, :embedding, NOW())
            RETURNING id
        """),
        {'entity_id': entity_id, 'embedding': embedding},
    )
    row = result.fetchone()
    return row[0] if row else 0


async def delete_embeddings(
    db: AsyncSession,
    entity_type: str,
    entity_id: int,
) -> int:
    """Delete all embeddings for an entity."""
    table_map = {
        'source': 'source_embeddings',
        'layer': 'layer_embeddings',
        'geometry': 'geometry_embeddings',
    }
    table = table_map.get(entity_type)

    if not table:
        raise ValueError(f"Unknown entity type: {entity_type}")

    result = await db.execute(
        text(f"""
            DELETE FROM {table}
            WHERE {entity_type}_id = :entity_id
        """),
        {'entity_id': entity_id},
    )
    return result.rowcount


# ============ API Endpoints ============

@router.post("/search", response_model=SearchResponse)
async def semantic_search(
    query: EmbeddingSearchQuery,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SearchResponse:
    """
    Perform semantic search across entities.

    This endpoint:
    1. Generates an embedding for the search query
    2. Searches for similar embeddings in the database
    3. Returns results ranked by similarity score
    """
    import time

    start_time = time.time()

    # Step 1: Generate embedding for the query
    query_embedding = await generate_query_embedding(query.query)

    if query_embedding is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding service unavailable",
        )

    # Step 2: Search across entity types
    all_results: list[SearchResult] = []

    # Search sources if no specific source is requested
    if query.source_id is None:
        source_results = await search_sources(
            db, query_embedding, query.top_k, query.similarity_threshold
        )
        all_results.extend(source_results)

    # Search layers
    layer_results = await search_layers(
        db, query_embedding, query.top_k, query.similarity_threshold, query.source_id
    )
    all_results.extend(layer_results)

    # Search geometry
    geometry_results = await search_geometry(
        db, query_embedding, query.top_k, query.similarity_threshold, query.source_id
    )
    all_results.extend(geometry_results)

    # Sort by similarity and limit results
    all_results.sort(key=lambda x: x.similarity_score, reverse=True)
    all_results = all_results[: query.top_k]

    search_time_ms = (time.time() - start_time) * 1000

    return SearchResponse(
        query=query.query,
        results=all_results,
        total_count=len(all_results),
        search_time_ms=search_time_ms,
    )


@router.post("/embeddings", response_model=EmbeddingResponse)
async def create_entity_embedding(
    embedding_data: EmbeddingCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EmbeddingResponse:
    """
    Create embeddings for an entity.

    Use this endpoint to generate and store embeddings for entities
    that don't have them yet.
    """
    # Generate embedding for the text content
    embedding = await generate_text_embedding(embedding_data.text_content)

    if embedding is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding service unavailable",
        )

    embedding_id = await create_embedding(
        db,
        embedding_data.entity_type,
        embedding_data.entity_id,
        embedding,
    )

    return EmbeddingResponse(
        entity_type=embedding_data.entity_type,
        entity_id=embedding_data.entity_id,
        embedding_id=embedding_id,
        created_at=datetime.utcnow(),
        dimension=len(embedding),
    )


@router.delete("/embeddings/{entity_type}/{entity_id}")
async def delete_entity_embedding(
    entity_type: str,
    entity_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Delete all embeddings for an entity."""
    deleted_count = await delete_embeddings(db, entity_type, entity_id)
    return {
        'deleted': deleted_count,
        'entity_type': entity_type,
        'entity_id': entity_id,
    }


@router.get("/embeddings/{entity_type}/{entity_id}")
async def get_entity_embedding(
    entity_type: str,
    entity_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Get existing embeddings for an entity."""
    embedding = await get_embedding(db, entity_type, entity_id)
    return {
        'entity_type': entity_type,
        'entity_id': entity_id,
        'has_embedding': embedding is not None,
        'dimension': len(embedding) if embedding else 0,
    }


@router.post("/embeddings/bulk")
async def create_bulk_embeddings(
    embeddings: list[EmbeddingCreate],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Create embeddings for multiple entities in bulk.

    Batch process multiple entities to reduce API calls.
    """
    results = []
    errors = []

    for embedding_data in embeddings:
        try:
            embedding = await generate_text_embedding(embedding_data.text_content)
            if embedding:
                embedding_id = await create_embedding(
                    db,
                    embedding_data.entity_type,
                    embedding_data.entity_id,
                    embedding,
                )
                results.append({
                    'entity_type': embedding_data.entity_type,
                    'entity_id': embedding_data.entity_id,
                    'embedding_id': embedding_id,
                    'success': True,
                })
            else:
                errors.append({
                    'entity_type': embedding_data.entity_type,
                    'entity_id': embedding_data.entity_id,
                    'error': 'Embedding generation failed',
                })
        except Exception as e:
            errors.append({
                'entity_type': embedding_data.entity_type,
                'entity_id': embedding_data.entity_id,
                'error': str(e),
            })

    return {
        'created': results,
        'errors': errors,
        'total_created': len(results),
        'total_errors': len(errors),
    }


# ============ Search Functions ============

async def search_sources(
    db: AsyncSession,
    query_embedding: list[float],
    top_k: int,
    threshold: float,
) -> list[SearchResult]:
    """Search across sources using vector similarity."""
    # Check if pgvector is available
    try:
        result = await db.execute(
            text("""
                SELECT
                    s.id,
                    s.name,
                    s.description,
                    s.metadata_,
                    1 - (e.embedding <=> :embedding) AS similarity
                FROM sources s
                JOIN source_embeddings e ON s.id = e.source_id
                WHERE 1 - (e.embedding <=> :embedding) > :threshold
                ORDER BY similarity DESC
                LIMIT :limit
            """),
            {
                'embedding': str(query_embedding),
                'threshold': threshold,
                'limit': top_k,
            },
        )
    except Exception as e:
        logger.warning(f"pgvector search failed: {e}")
        return []

    return [
        SearchResult(
            id=row[0],
            type='source',
            title=row[1],
            description=row[2],
            similarity_score=float(row[4]) if row[4] else 0,
            metadata=row[3] or {},
        )
        for row in result.fetchall()
    ]


async def search_layers(
    db: AsyncSession,
    query_embedding: list[float],
    top_k: int,
    threshold: float,
    source_id: Optional[int] = None,
) -> list[SearchResult]:
    """Search across layers using vector similarity."""
    try:
        query = """
            SELECT
                l.id,
                l.name,
                l.description,
                l.metadata_,
                l.source_id,
                1 - (e.embedding <=> :embedding) AS similarity
            FROM layers l
            JOIN layer_embeddings e ON l.id = e.layer_id
            WHERE 1 - (e.embedding <=> :embedding) > :threshold
        """
        params = {'embedding': str(query_embedding), 'threshold': threshold, 'limit': top_k}

        if source_id:
            query += " AND l.source_id = :source_id"
            params['source_id'] = source_id

        query += " ORDER BY similarity DESC LIMIT :limit"

        result = await db.execute(text(query), params)
    except Exception as e:
        logger.warning(f"pgvector search failed: {e}")
        return []

    return [
        SearchResult(
            id=row[0],
            type='layer',
            title=row[1],
            description=row[2],
            similarity_score=float(row[5]) if row[5] else 0,
            metadata={
                **(row[3] or {}),
                'source_id': row[4],
            },
        )
        for row in result.fetchall()
    ]


async def search_geometry(
    db: AsyncSession,
    query_embedding: list[float],
    top_k: int,
    threshold: float,
    source_id: Optional[int] = None,
) -> list[SearchResult]:
    """Search across geometry using vector similarity."""
    try:
        query = """
            SELECT
                g.id,
                g.gid,
                g.metadata_,
                g.source_id,
                1 - (e.embedding <=> :embedding) AS similarity
            FROM geometry g
            JOIN geometry_embeddings e ON g.id = e.geometry_id
            WHERE 1 - (e.embedding <=> :embedding) > :threshold
        """
        params = {'embedding': str(query_embedding), 'threshold': threshold, 'limit': top_k}

        if source_id:
            query += " AND g.source_id = :source_id"
            params['source_id'] = source_id

        query += " ORDER BY similarity DESC LIMIT :limit"

        result = await db.execute(text(query), params)
    except Exception as e:
        logger.warning(f"pgvector search failed: {e}")
        return []

    return [
        SearchResult(
            id=row[0],
            type='geometry',
            title=row[1],
            description=None,
            similarity_score=float(row[4]) if row[4] else 0,
            metadata={
                **(row[2] or {}),
                'source_id': row[3],
            },
        )
        for row in result.fetchall()
    ]


# ============ Embedding Generation ============

async def generate_query_embedding(query: str) -> Optional[list[float]]:
    """
    Generate embedding for a search query.

    Uses OpenAI's text-embedding-3-small model by default.
    Can be extended to support alternative providers.
    """
    # This would use the OpenAI API or alternative
    # For now, return a placeholder - in production, call the actual API
    try:
        from openai import AsyncOpenAI
        import os

        client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        response = await client.embeddings.create(
            model='text-embedding-3-small',
            input=query,
            dimensions=EMBEDDING_DIMENSION,
        )

        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return None


async def generate_text_embedding(text: str) -> Optional[list[float]]:
    """Generate embedding for arbitrary text content."""
    return await generate_query_embedding(text)


# ============ Database Setup ============

async def init_pgvector(db: AsyncSession) -> None:
    """Initialize pgvector extension and tables."""
    # Create extension
    await db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    # Create embedding tables
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS source_embeddings (
            id SERIAL PRIMARY KEY,
            source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
            embedding VECTOR(:dimension),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """), {'dimension': EMBEDDING_DIMENSION})

    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS layer_embeddings (
            id SERIAL PRIMARY KEY,
            layer_id INTEGER NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
            embedding VECTOR(:dimension),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """), {'dimension': EMBEDDING_DIMENSION})

    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS geometry_embeddings (
            id SERIAL PRIMARY KEY,
            geometry_id INTEGER NOT NULL REFERENCES geometry(id) ON DELETE CASCADE,
            embedding VECTOR(:dimension),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """), {'dimension': EMBEDDING_DIMENSION})

    # Create indexes for fast similarity search
    await db.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_source_embeddings_cos
        ON source_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """))

    await db.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_layer_embeddings_cos
        ON layer_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """))

    await db.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_geometry_embeddings_cos
        ON geometry_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """))

    await db.commit()
