from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/maps"
    REDIS_URL: str = "redis://localhost:6379/0"
    ETL_SERVICE_URL: str = "http://localhost:8001"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # Keycloak OIDC Configuration
    KEYCLOAK_SERVER_URL: str = "http://localhost:8080"
    KEYCLOAK_REALM: str = "maps-platform"
    KEYCLOAK_CLIENT_ID: str = "maps-platform-api"
    KEYCLOAK_CLIENT_SECRET: str = ""
    KEYCLOAK_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/keycloak/callback"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
