# Django to FastAPI + Rust Migration Design

**Date:** 2025-12-28
**Status:** Approved
**Goal:** Migrate Django REST API to FastAPI with Rust acceleration while preserving API contract

---

## Executive Summary

Rewrite the maps platform backend from Django REST Framework to FastAPI with performance-critical operations accelerated by a Rust library (via PyO3). The migration uses a big-bang approach with contract-first testing to ensure API compatibility.

---

## Architecture

```
                         ┌─────────────────────┐
                         │   Message Queue     │
                         │   (Redis)           │
                         └──────────┬──────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Main API    │         │  ETL Service    │         │   PostgreSQL    │
│   (FastAPI)   │────────▶│  (FastAPI)      │────────▶│   + PostGIS     │
│   Port 8000   │  HTTP   │  Port 8001      │         │                 │
└───────────────┘         └─────────────────┘         └─────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   geo_engine    │
                          │   (Rust/PyO3)   │
                          └─────────────────┘
```

### Services

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| api | FastAPI | 8000 | Main REST API |
| etl-service | FastAPI | 8001 | Import/analysis microservice |
| postgres | PostGIS 14 | 5432 | Spatial database |
| redis | Redis 7 | 6379 | Cache + task queue |
| martin | Martin | 3000 | MVT tile server |
| titiler | TiTiler | 9000 | Raster tile server |

---

## Technology Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Database ORM | SQLAlchemy + GeoAlchemy2 | Mature PostGIS support, Alembic migrations |
| Authentication | FastAPI-Users | Batteries-included auth with SQLAlchemy integration |
| Async Strategy | Fully async (asyncpg) | Maximum throughput for I/O-bound operations |
| Rust Integration | Single PyO3 library | Simpler deployment, shared types |
| ETL Architecture | Dedicated microservice | Separation of concerns, independent scaling |
| Testing | Contract-first pytest | Ensures API compatibility |

---

## Project Structure

### Main API

```
api/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, middleware, startup
│   ├── config.py               # Settings via pydantic-settings
│   │
│   ├── core/
│   │   ├── database.py         # Async SQLAlchemy engine, session
│   │   ├── dependencies.py     # Dependency injection
│   │   └── security.py         # FastAPI-Users setup
│   │
│   ├── models/                 # SQLAlchemy + GeoAlchemy2 models
│   │   ├── base.py
│   │   ├── source.py
│   │   ├── geometry.py
│   │   ├── layer.py
│   │   ├── project.py
│   │   └── user.py
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── source.py
│   │   ├── geometry.py
│   │   ├── layer.py
│   │   ├── project.py
│   │   └── user.py
│   │
│   ├── routes/                 # API endpoints
│   │   ├── sources.py
│   │   ├── layers.py
│   │   ├── projects.py
│   │   ├── geometry.py
│   │   └── users.py
│   │
│   └── services/               # Business logic
│       ├── source_service.py
│       ├── import_service.py
│       └── geometry_service.py
│
├── geo_engine/                 # Rust crate
├── tests/
├── alembic/
├── pyproject.toml
└── Dockerfile
```

### ETL Microservice

```
etl-service/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── core/
│   │   ├── database.py
│   │   └── queue.py
│   │
│   ├── tasks/
│   │   ├── shapefile.py
│   │   ├── csv.py
│   │   ├── geojson.py
│   │   ├── source_stats.py
│   │   └── analysis.py
│   │
│   ├── routes/
│   │   ├── health.py
│   │   ├── tasks.py
│   │   └── triggers.py
│   │
│   └── workers/
│       └── consumer.py
│
├── geo_engine/                 # Shared Rust crate
├── pyproject.toml
└── Dockerfile
```

### Rust Library (geo_engine)

```
geo_engine/
├── Cargo.toml
├── pyproject.toml              # maturin config
├── src/
│   ├── lib.rs                  # PyO3 module exports
│   │
│   ├── geometry/
│   │   ├── mod.rs
│   │   ├── parser.rs           # Shapefile, GeoJSON, GML parsing
│   │   ├── transform.rs        # Coordinate reprojection
│   │   ├── simplify.rs         # Douglas-Peucker, Visvalingam
│   │   └── validation.rs       # Geometry validity checks
│   │
│   ├── import/
│   │   ├── mod.rs
│   │   ├── shapefile.rs        # Parallel shapefile reading
│   │   ├── csv.rs              # CSV to Point geometry
│   │   ├── geojson.rs          # GeoJSON feature extraction
│   │   └── metadata.rs         # Column type inference
│   │
│   ├── analysis/
│   │   ├── mod.rs
│   │   ├── interpolation.rs    # Spline interpolation
│   │   ├── vectorize.rs        # Raster to vector
│   │   └── grid.rs             # Grid-based inference
│   │
│   └── types/
│       ├── mod.rs
│       └── geometry.rs         # WKB, GeoJSON types
```

**Rust Dependencies:**

```toml
[dependencies]
pyo3 = { version = "0.21", features = ["extension-module"] }
geo = "0.28"
proj = "0.27"
shapefile = "0.6"
geojson = "0.24"
rayon = "1.10"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wkb = "0.7"
ndarray = "0.15"
```

**Python API:**

```python
from geo_engine import (
    # Geometry
    parse_shapefile,
    parse_geojson,
    transform_crs,
    simplify_geometry,

    # Import
    stream_shapefile,
    stream_csv_points,
    infer_metadata,

    # Analysis
    interpolate_spline,
    vectorize_raster,
    grid_inference,
)
```

---

## Database Models

Models map to existing Django tables to avoid data migration:

```python
# app/models/source.py
class Source(Base, TimestampMixin):
    __tablename__ = "core_source"

    id: Mapped[int] = mapped_column(primary_key=True)
    sid: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    source_type: Mapped[str] = mapped_column(String(50), index=True)
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)

# app/models/geometry.py
class GeometryModel(Base):
    __tablename__ = "core_geometry"

    gid: Mapped[int] = mapped_column(primary_key=True)
    geom: Mapped[WKBElement] = mapped_column(Geometry(srid=4326, spatial_index=True))
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    geometry_type: Mapped[str] = mapped_column(String(50), index=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("core_source.id"))
```

---

## API Endpoints

### Preserved Endpoints (API Contract)

| Method | Path | Purpose |
|--------|------|---------|
| GET, POST | `/api/v1/sources/` | List/create sources |
| GET, PUT, PATCH, DELETE | `/api/v1/sources/{id}/` | Source detail |
| GET, POST | `/api/v1/layers/` | List/create layers |
| GET, PUT, PATCH, DELETE | `/api/v1/layers/{id}/` | Layer detail |
| GET, POST | `/api/v1/projects/` | List/create projects |
| GET, PUT, PATCH, DELETE | `/api/v1/projects/{id}/` | Project detail |
| GET | `/api/v1/wfs/` | GeoJSON geometries |
| GET, PUT, PATCH | `/api/v1/user-profile/` | User profile |

### New Auth Endpoints (FastAPI-Users)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Confirm password reset |

### ETL Service Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/tasks/import/shapefile` | Import shapefile |
| POST | `/tasks/import/csv` | Import CSV |
| POST | `/tasks/import/geojson` | Import GeoJSON |
| POST | `/tasks/analysis/interpolate` | Run interpolation |
| POST | `/tasks/analysis/vectorize` | Raster to vector |
| GET | `/tasks/{task_id}` | Get task status |
| GET | `/health` | Health check |

---

## Testing Strategy

### Contract Testing

Export current Django OpenAPI schema and validate FastAPI matches:

```python
def test_openapi_schema_compatibility(client):
    response = client.get("/api/schema/")
    fastapi_schema = response.json()

    for path, methods in DJANGO_SCHEMA["paths"].items():
        assert path in fastapi_schema["paths"]
        # Compare request/response schemas
```

### Test Structure

```
tests/
├── conftest.py
├── contract/
│   ├── openapi_schema.json     # Exported from Django
│   └── test_contract.py
├── integration/
│   ├── test_sources.py
│   ├── test_layers.py
│   ├── test_projects.py
│   ├── test_geometry.py
│   └── test_auth.py
├── unit/
│   ├── test_services.py
│   └── test_schemas.py
└── etl/
    ├── test_shapefile_import.py
    └── test_analysis.py
```

### Rust Tests

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_parse_shapefile() {
        let features = parse_shapefile("fixtures/test.shp", 4326).unwrap();
        assert_eq!(features.len(), 100);
    }
}
```

---

## Docker Configuration

### docker-compose.yml

```yaml
version: "3.8"

services:
  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/maps
      - REDIS_URL=redis://redis:6379/0
      - ETL_SERVICE_URL=http://etl-service:8001
    depends_on:
      - postgres
      - redis

  etl-service:
    build: ./etl-service
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/maps
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    volumes:
      - upload-data:/app/uploads

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

### Dockerfile (Multi-stage with Rust)

```dockerfile
# Stage 1: Build Rust library
FROM rust:1.75-slim as rust-builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3-dev
COPY geo_engine/ ./geo_engine/
RUN pip install maturin && cd geo_engine && maturin build --release

# Stage 2: Python app
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgdal-dev libgeos-dev libproj-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=rust-builder /app/geo_engine/target/wheels/*.whl /tmp/
RUN pip install /tmp/*.whl

COPY pyproject.toml ./
RUN pip install -e .

COPY app/ ./app/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Create project structure (api/, etl-service/, geo_engine/)
- [ ] Set up pyproject.toml with dependencies
- [ ] Set up Cargo.toml for geo_engine
- [ ] Configure Alembic for migrations
- [ ] Export Django OpenAPI schema for contract testing

### Phase 2: Core Infrastructure
- [ ] Implement database connection (async SQLAlchemy)
- [ ] Implement FastAPI-Users authentication
- [ ] Set up Redis connection
- [ ] Create base models matching Django tables

### Phase 3: Rust Library
- [ ] Implement geometry parsing (shapefile, GeoJSON)
- [ ] Implement coordinate transforms
- [ ] Implement bulk import streaming
- [ ] Implement spatial analysis functions
- [ ] Write Rust tests

### Phase 4: API Endpoints
- [ ] Implement /sources/ endpoints
- [ ] Implement /layers/ endpoints
- [ ] Implement /projects/ endpoints
- [ ] Implement /wfs/ endpoint
- [ ] Implement /user-profile/ endpoint
- [ ] Run contract tests

### Phase 5: ETL Microservice
- [ ] Set up ETL service structure
- [ ] Implement task queue (Redis)
- [ ] Implement shapefile import task
- [ ] Implement CSV import task
- [ ] Implement analysis tasks
- [ ] Implement task status API

### Phase 6: Testing & Deployment
- [ ] Write integration tests
- [ ] Validate contract compatibility
- [ ] Update docker-compose.yml
- [ ] Build and test Docker images
- [ ] Deploy and verify

---

## Breaking Changes

1. **Auth endpoint paths changed:**
   - `/rest-auth/login/` → `/api/v1/auth/login`
   - `/rest-auth/registration/` → `/api/v1/auth/register`
   - Frontend must update auth calls

2. **CLI commands replaced:**
   - `python manage.py upload_shapefile` → HTTP POST to ETL service
   - Or new CLI wrapper that calls ETL service

---

## Performance Targets

| Operation | Current (Django) | Target (FastAPI + Rust) |
|-----------|-----------------|------------------------|
| Shapefile parse (1M records) | ~60s | ~6s (10x) |
| API response (list) | ~50ms | ~20ms |
| Bulk insert (10K records) | ~30s | ~5s |
| Coordinate transform (1M points) | ~10s | ~1s |
