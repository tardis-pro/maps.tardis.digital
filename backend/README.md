# Maps Platform Backend

FastAPI-based geospatial API with Rust-accelerated operations.

## Architecture

```
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Main API    │         │  ETL Service    │         │   PostgreSQL    │
│   (FastAPI)   │────────▶│  (FastAPI)      │────────▶│   + PostGIS     │
│   Port 8000   │         │  Port 8001      │         │                 │
└───────────────┘         └─────────────────┘         └─────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   geo_engine    │
                          │   (Rust/PyO3)   │
                          └─────────────────┘
```

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

## ETL Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /tasks/import/shapefile | Import shapefile |
| POST | /tasks/import/csv | Import CSV |
| POST | /tasks/import/geojson | Import GeoJSON |
| GET | /tasks/{task_id} | Get task status |

## Testing

```bash
cd api
pytest
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| api | 8000 | Main REST API |
| etl-service | 8001 | ETL microservice |
| postgres | 5432 | PostGIS database |
| redis | 6379 | Cache + queue |
| martin | 3000 | MVT tile server |
| titiler | 9000 | Raster tile server |
| keycloak | 8080 | OAuth provider |
| maptiler | 28080 | Static tiles |

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](../LICENSE) file for details.
