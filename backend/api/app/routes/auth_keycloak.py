"""
Keycloak Authentication Routes for FastAPI.

This module provides OAuth2/OIDC authentication endpoints for Keycloak integration.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from starlette.requests import Request

from app.core.keycloak import (
    get_keycloak_config,
    get_keycloak_token,
    get_keycloak_userinfo,
    keycloak_auth_backend,
    KeycloakConfig,
    KeycloakUserInfo,
)
from app.core.users import fastapi_users, current_active_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth/keycloak", tags=["auth-keycloak"])


@router.get("/login")
async def keycloak_login(
    request: Request,
    config: KeycloakConfig = Depends(get_keycloak_config),
):
    """
    Redirect to Keycloak login page.
    
    This endpoint initiates the OAuth2 authorization code flow with Keycloak.
    """
    auth_url = (
        f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/auth"
        f"?response_type=code"
        f"&client_id={config.client_id}"
        f"&redirect_uri={config.redirect_uri}"
        f"&scope=openid+profile+email"
    )
    
    logger.info(f"Redirecting to Keycloak login: {config.server_url}/realms/{config.realm}")
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def keycloak_callback(
    request: Request,
    code: str = None,
    error: str = None,
    config: KeycloakConfig = Depends(get_keycloak_config),
):
    """
    Handle Keycloak OAuth2 callback.
    
    Exchanges authorization code for access token and returns user info.
    """
    if error:
        logger.error(f"Keycloak callback error: {error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Keycloak error: {error}",
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing authorization code",
        )
    
    try:
        # Exchange code for token
        token_response = await get_keycloak_token(request, code, config)
        
        # Get user info from Keycloak
        userinfo = await get_keycloak_userinfo(
            token_response["access_token"],
            config,
        )
        
        # Return token info (frontend should handle JWT creation)
        return {
            "access_token": token_response["access_token"],
            "token_type": token_response.get("token_type", "Bearer"),
            "expires_in": token_response.get("expires_in"),
            "userinfo": userinfo.model_dump(exclude_none=True),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Keycloak callback failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed",
        )


@router.get("/userinfo")
async def keycloak_userinfo(
    userinfo: KeycloakUserInfo = Depends(get_keycloak_userinfo),
) -> dict:
    """
    Get current user info from Keycloak.
    
    Requires valid access token in Authorization header.
    """
    return {
        "sub": userinfo.sub,
        "email": userinfo.email,
        "name": userinfo.name,
        "username": userinfo.preferred_username,
    }


@router.post("/logout")
async def keycloak_logout(
    request: Request,
    config: KeycloakConfig = Depends(get_keycloak_config),
):
    """
    Logout from Keycloak.
    
    Redirects to Keycloak logout endpoint.
    """
    logout_url = (
        f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/logout"
        f"?post_logout_redirect_uri={config.redirect_uri.replace('/callback', '')}"
    )
    
    return RedirectResponse(url=logout_url)


@router.get("/config")
async def keycloak_config(
    config: KeycloakConfig = Depends(get_keycloak_config),
) -> dict:
    """
    Return Keycloak OIDC configuration for frontend.
    
    This endpoint provides the configuration needed by the frontend
    to initialize the OIDC client.
    """
    return {
        "issuer": f"{config.server_url}/realms/{config.realm}",
        "authorization_endpoint": f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/auth",
        "token_endpoint": config.token_url,
        "userinfo_endpoint": config.userinfo_url,
        "jwks_uri": config.jwks_url,
        "client_id": config.client_id,
        "redirect_uri": config.redirect_uri,
    }
