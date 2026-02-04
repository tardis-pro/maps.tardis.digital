"""
OpenAPI 3.0 Schema Generation and Documentation.

This module provides comprehensive OpenAPI documentation for the Maps Platform API,
including custom schemas, examples, and best practices for API documentation.

Features:
- Auto-generated OpenAPI 3.0 schema
- Custom request/response examples
- API versioning support
- Tag descriptions
- Security schemes
"""

from typing import Any
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field

from app.config import settings
from app.schemas import (
    UserRead,
    UserCreate,
    SourceCreate,
    SourceUpdate,
    SourceSchema,
    LayerCreate,
    LayerUpdate,
    LayerSchema,
    ProjectCreate,
    ProjectUpdate,
    ProjectSchema,
)


# Custom OpenAPI example data
OPENAPI_EXAMPLES = {
    "source_create": {
        "summary": "Create a new geospatial data source",
        "value": {
            "name": "City Buildings",
            "description": "Building footprints for downtown area",
            "source_type": "geojson",
            "uri": "https://example.com/buildings.geojson",
            "metadata": {
                "crs": "EPSG:4326",
                "last_updated": "2024-01-15",
                "source_organization": "City GIS Department",
            },
        },
    },
    "layer_create": {
        "summary": "Create a visualization layer",
        "value": {
            "name": "Building Heights",
            "description": "Color-coded building heights",
            "source_id": 1,
            "layer_type": "fill-extrusion",
            "style": {
                "fill_color": {
                    "property": "height",
                    "stops": [[0, "green"], [100, "red"]],
                },
                "extrusion_height": {"property": "height"},
            },
        },
    },
    "project_create": {
        "summary": "Create a map project",
        "value": {
            "name": "Downtown Analysis",
            "description": "Comprehensive analysis of downtown area",
            "layer_ids": [1, 2, 3],
            "view_state": {
                "latitude": 40.7128,
                "longitude": -74.0060,
                "zoom": 14,
                "pitch": 45,
                "bearing": 0,
            },
        },
    },
    "user_create": {
        "summary": "Register a new user",
        "value": {
            "email": "analyst@example.com",
            "password": "securePassword123!",
            "username": "analyst_user",
        },
    },
}


def create_custom_openapi(app: FastAPI) -> dict[str, Any]:
    """
    Generate custom OpenAPI schema with examples and descriptions.
    
    This function creates a comprehensive OpenAPI 3.0 schema that includes:
    - Detailed API information
    - Security schemes
    - Custom examples for requests/responses
    - Tag descriptions
    - Server configurations
    """
    
    openapi_schema = get_openapi(
        title="Maps Platform API",
        version="0.1.0",
        description="""
# Maps Platform API Documentation

A comprehensive geospatial data management and visualization API.

## Features

- **Geospatial Data Management**: Upload, store, and query geospatial data
- **Layer-based Visualization**: Create and configure map layers
- **Project Organization**: Organize layers into projects
- **Real-time Processing**: ETL service for data transformation

## Authentication

All API endpoints require authentication except:
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/health`
- `/ready`

Use Bearer token authentication by including the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Rate Limiting

API requests are rate limited to prevent abuse. Rate limits vary by endpoint:
- **Anonymous users**: 100 requests/minute
- **Authenticated users**: 1000 requests/minute
- **Sensitive endpoints**: 10 requests/minute

## Error Handling

All errors follow RFC 7807 Problem Details format:

```json
{
  "type": "https://api.tardis.digital/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Invalid coordinate format",
  "instance": "/api/v1/wfs/"
}
```

## Versioning

API versioning is done through the URL path: `/api/v1/`

Breaking changes will only be introduced in new major versions.
        """,
        terms_of_service="https://tardis.digital/terms",
        contact={
            "name": "Maps Platform Team",
            "email": "api-support@tardis.digital",
            "url": "https://tardis.digital/support",
        },
        license_info={
            "name": "BSD 3-Clause",
            "url": "https://github.com/tardis-pro/maps.tardis.digital/blob/main/LICENSE",
        },
        servers=[
            {"url": "https://api.tardis.digital", "description": "Production API"},
            {"url": "http://localhost:8000", "description": "Local development"},
        ],
        tags=[
            {
                "name": "auth",
                "description": "Authentication and user management",
            },
            {
                "name": "sources",
                "description": "Geospatial data sources",
            },
            {
                "name": "layers",
                "description": "Map visualization layers",
            },
            {
                "name": "projects",
                "description": "Map projects and configurations",
            },
            {
                "name": "wfs",
                "description": "Web Feature Service - Query geometries",
            },
            {
                "name": "users",
                "description": "User profile management",
            },
            {
                "name": "health",
                "description": "Health check and monitoring",
            },
        ],
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT authorization header. Use the `/api/v1/auth/login` endpoint to obtain a token.",
        }
    }
    
    # Add custom examples to schema
    openapi_schema["components"]["examples"] = OPENAPI_EXAMPLES
    
    # Add parameter examples
    for path in openapi_schema.get("paths", {}).values():
        for method in path.values():
            if "parameters" in method:
                for param in method["parameters"]:
                    if param["name"] == "bbox":
                        param["example"] = "-74.026,40.691,-74.003,40.708"
                    elif param["name"] == "limit":
                        param["example"] = 1000
                    elif param["name"] == "page":
                        param["example"] = 1
                    elif param["name"] == "page_size":
                        param["example"] = 25
    
    return openapi_schema


def setup_openapi(app: FastAPI) -> None:
    """
    Configure FastAPI with custom OpenAPI schema.
    
    This function:
    1. Replaces the default OpenAPI schema with our custom one
    2. Ensures proper schema URL configuration
    3. Adds metadata for API documentation
    """
    app.openapi = lambda: create_custom_openapi(app)


# Alias for compatibility
customize_openapi = setup_openapi


# Documentation metadata for models
DOCUMENTATION = {
    "SourceSchema": {
        "description": "A geospatial data source containing raw data",
        "examples": [OPENAPI_EXAMPLES["source_create"]],
    },
    "LayerSchema": {
        "description": "A visualization layer for displaying data on maps",
        "examples": [OPENAPI_EXAMPLES["layer_create"]],
    },
    "ProjectSchema": {
        "description": "A project containing multiple layers and view configuration",
        "examples": [OPENAPI_EXAMPLES["project_create"]],
    },
    "UserRead": {
        "description": "User profile information",
    },
    "UserCreate": {
        "description": "User registration data",
        "examples": [OPENAPI_EXAMPLES["user_create"]],
    },
}
