"""
Keycloak OIDC Authentication for FastAPI.

This module provides OIDC authentication integration with Keycloak
for the Maps Platform API.

Requirements:
- Keycloak server running and configured
- Client credentials in settings
- User federation to Keycloak realm
"""

import logging
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi_users import FastAPIUsers, BaseUserManager, IntegerIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from fastapi_users.exceptions import UserAlreadyExists, InvalidCredentials
from httpx import AsyncClient, ASGITransport
from pydantic import BaseModel, Field

from app.config import settings
from app.core.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)


class KeycloakConfig(BaseModel):
    """Keycloak OIDC configuration."""
    server_url: str = Field(..., description="Keycloak server URL")
    realm: str = Field(..., description="Keycloak realm name")
    client_id: str = Field(..., description="OAuth2 client ID")
    client_secret: str = Field(..., description="OAuth2 client secret")
    redirect_uri: str = Field(default="http://localhost:8000/api/v1/auth/keycloak/callback", description="Callback URL")
    
    @property
    def authorization_url(self) -> str:
        """Get Keycloak authorization URL."""
        return (
            f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/auth"
            f"?response_type=code"
            f"&client_id={self.client_id}"
            f"&redirect_uri={self.redirect_uri}"
            f"&scope=openid+profile+email"
        )
    
    @property
    def token_url(self) -> str:
        """Get Keycloak token endpoint URL."""
        return f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/token"
    
    @property
    def userinfo_url(self) -> str:
        """Get Keycloak userinfo endpoint URL."""
        return f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/userinfo"
    
    @property
    def jwks_url(self) -> str:
        """Get Keycloak JWKS endpoint URL."""
        return f"{self.server_url}/realms/{self.realm}/protocol/openid-connect/certs"


# Keycloak configuration from settings
def get_keycloak_config() -> KeycloakConfig:
    """Create Keycloak configuration from settings."""
    return KeycloakConfig(
        server_url=settings.KEYCLOAK_SERVER_URL,
        realm=settings.KEYCLOAK_REALM,
        client_id=settings.KEYCLOAK_CLIENT_ID,
        client_secret=settings.KEYCLOAK_CLIENT_SECRET,
        redirect_uri=settings.KEYCLOAK_REDIRECT_URI,
    )


class KeycloakUserInfo(BaseModel):
    """Keycloak user info response."""
    sub: str  # Subject identifier
    email: Optional[str] = None
    email_verified: Optional[bool] = None
    name: Optional[str] = None
    preferred_username: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None


async def get_keycloak_userinfo(
    access_token: str,
    config: KeycloakConfig = Depends(get_keycloak_config),
) -> KeycloakUserInfo:
    """
    Fetch user info from Keycloak using access token.
    
    Args:
        access_token: OAuth2 access token
        config: Keycloak configuration
        
    Returns:
        KeycloakUserInfo with user details
        
    Raises:
        HTTPException: If token is invalid or Keycloak is unreachable
    """
    async with AsyncClient(transport=ASGITransport(app=None)) as client:
        try:
            response = await client.get(
                config.userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0,
            )
            
            if response.status_code != 200:
                logger.error(f"Keycloak userinfo failed: {response.status_code}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid access token",
                )
            
            return KeycloakUserInfo(**response.json())
            
        except Exception as e:
            logger.error(f"Keycloak userinfo request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Keycloak authentication service unavailable",
            )


class KeycloakUserManager(IntegerIDMixin, BaseUserManager[User, int]):
    """
    User manager that syncs users from Keycloak.
    
    This manager handles:
    - Automatic user creation on first login
    - User profile updates from Keycloak
    - Password management (handled by Keycloak)
    """
    
    async def authenticate(self, user_db: SQLAlchemyUserDatabase, userinfo: KeycloakUserInfo) -> Optional[User]:
        """
        Authenticate user from Keycloak userinfo.
        
        Creates user if they don't exist, updates profile if they do.
        """
        # Find user by Keycloak subject ID
        user = await self.user_db.get_by_attribute("keycloak_id", userinfo.sub)
        
        if user is None:
            # Create new user from Keycloak info
            user = await self.user_db.create({
                "keycloak_id": userinfo.sub,
                "email": userinfo.email or f"{userinfo.preferred_username}@keycloak.local",
                "username": userinfo.preferred_username or userinfo.email.split("@")[0] if userinfo.email else userinfo.sub,
                "full_name": userinfo.name or f"{userinfo.given_name or ''} {userinfo.family_name or ''}".strip(),
                "hashed_password": "",  # No password - managed by Keycloak
                "is_active": True,
                "is_superuser": False,
            })
            logger.info(f"Created new user from Keycloak: {user.email}")
        else:
            # Update existing user profile
            update_data = {}
            if userinfo.email and userinfo.email != user.email:
                update_data["email"] = userinfo.email
            if userinfo.name and userinfo.name != user.full_name:
                update_data["full_name"] = userinfo.name
            
            if update_data:
                await self.user_db.update(user, update_data)
                logger.info(f"Updated user from Keycloak: {user.email}")
        
        return user


# OAuth2 scheme for Keycloak authorization code flow
keycloak_oauth_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="",  # Set dynamically
    tokenUrl="",  # Set dynamically
    auto_error=False,
)


async def get_keycloak_token(
    request: Request,
    code: str,
    config: KeycloakConfig = Depends(get_keycloak_config),
) -> dict:
    """
    Exchange authorization code for access token from Keycloak.
    
    Args:
        request: HTTP request
        code: Authorization code from Keycloak callback
        config: Keycloak configuration
        
    Returns:
        Token response from Keycloak
    """
    async with AsyncClient(transport=ASGITransport(app=None)) as client:
        try:
            token_response = await client.post(
                config.token_url,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": config.redirect_uri,
                    "client_id": config.client_id,
                    "client_secret": config.client_secret,
                },
                timeout=10.0,
            )
            
            if token_response.status_code != 200:
                logger.error(f"Keycloak token exchange failed: {token_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code",
                )
            
            return token_response.json()
            
        except Exception as e:
            logger.error(f"Keycloak token request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Keycloak authentication service unavailable",
            )


# Keycloak-backed authentication backend
keycloak_auth_backend = AuthenticationBackend(
    name="keycloak",
    transport=BearerTransport(tokenUrl="/api/v1/auth/keycloak/login"),
    get_strategy=lambda: JWTStrategy(
        secret=settings.SECRET_KEY,
        lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    ),
)
