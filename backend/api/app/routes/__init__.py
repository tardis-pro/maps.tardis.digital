from app.routes.sources import router as sources_router
from app.routes.layers import router as layers_router
from app.routes.projects import router as projects_router
from app.routes.geometry import router as geometry_router
from app.routes.users import router as users_router
from app.routes.auth_keycloak import router as auth_keycloak_router

__all__ = [
    "sources_router",
    "layers_router",
    "projects_router",
    "geometry_router",
    "users_router",
    "auth_keycloak_router",
]
