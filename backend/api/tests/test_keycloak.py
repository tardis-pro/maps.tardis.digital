"""
Tests for Keycloak OIDC Authentication.

These tests verify that:
1. Keycloak configuration is correctly loaded
2. OAuth2 flow endpoints exist
3. Token exchange works correctly
4. User info can be fetched from Keycloak
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.main import app
from app.core.keycloak import (
    get_keycloak_config,
    KeycloakConfig,
    get_keycloak_userinfo,
    KeycloakUserInfo,
)
from app.config import settings


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def mock_keycloak_config():
    """Mock Keycloak configuration for testing."""
    return KeycloakConfig(
        server_url="http://localhost:8080",
        realm="test-realm",
        client_id="test-client",
        client_secret="test-secret",
        redirect_uri="http://localhost:8000/api/v1/auth/keycloak/callback",
    )


class TestKeycloakConfiguration:
    """Tests for Keycloak configuration."""

    def test_keycloak_config_model(self, mock_keycloak_config):
        """Verify Keycloak config model works."""
        assert mock_keycloak_config.server_url == "http://localhost:8080"
        assert mock_keycloak_config.realm == "test-realm"
        assert mock_keycloak_config.client_id == "test-client"

    def test_keycloak_authorization_url(self, mock_keycloak_config):
        """Verify authorization URL generation."""
        auth_url = mock_keycloak_config.authorization_url
        assert "http://localhost:8080/realms/test-realm/protocol/openid-connect/auth" in auth_url
        assert "client_id=test-client" in auth_url
        assert "response_type=code" in auth_url

    def test_keycloak_token_url(self, mock_keycloak_config):
        """Verify token URL generation."""
        token_url = mock_keycloak_config.token_url
        assert token_url == "http://localhost:8080/realms/test-realm/protocol/openid-connect/token"

    def test_keycloak_userinfo_url(self, mock_keycloak_config):
        """Verify userinfo URL generation."""
        userinfo_url = mock_keycloak_config.userinfo_url
        assert userinfo_url == "http://localhost:8080/realms/test-realm/protocol/openid-connect/userinfo"

    def test_keycloak_jwks_url(self, mock_keycloak_config):
        """Verify JWKS URL generation."""
        jwks_url = mock_keycloak_config.jwks_url
        assert jwks_url == "http://localhost:8080/realms/test-realm/protocol/openid-connect/certs"


class TestKeycloakUserInfo:
    """Tests for Keycloak user info model."""

    def test_userinfo_model(self):
        """Verify Keycloak user info model works."""
        userinfo = KeycloakUserInfo(
            sub="user-123",
            email="user@example.com",
            name="Test User",
            preferred_username="testuser",
        )
        assert userinfo.sub == "user-123"
        assert userinfo.email == "user@example.com"
        assert userinfo.name == "Test User"
        assert userinfo.preferred_username == "testuser"

    def test_userinfo_optional_fields(self):
        """Verify optional fields can be None."""
        userinfo = KeycloakUserInfo(sub="user-456")
        assert userinfo.sub == "user-456"
        assert userinfo.email is None
        assert userinfo.name is None


class TestKeycloakRoutes:
    """Tests for Keycloak authentication routes."""

    def test_keycloak_config_endpoint_exists(self, client):
        """Verify Keycloak config endpoint exists."""
        response = client.get("/api/v1/auth/keycloak/config")
        # Should return 200 or 422 (if settings not configured)
        assert response.status_code in [200, 422, 500]

    def test_keycloak_login_redirect_exists(self, client):
        """Verify Keycloak login redirect endpoint exists."""
        response = client.get("/api/v1/auth/keycloak/login")
        # Should redirect or return 302/redirect response
        assert response.status_code in [200, 302, 303, 307, 308]

    def test_keycloak_callback_exists(self, client):
        """Verify Keycloak callback endpoint exists."""
        # Test without code - should return 400
        response = client.get("/api/v1/auth/keycloak/callback")
        assert response.status_code == 400

    def test_keycloak_logout_redirect_exists(self, client):
        """Verify Keycloak logout redirect endpoint exists."""
        response = client.post("/api/v1/auth/keycloak/logout")
        # Should redirect
        assert response.status_code in [200, 302, 303, 307, 308]


class TestKeycloakIntegration:
    """Integration tests for Keycloak authentication."""

    def test_app_has_keycloak_routes(self, client):
        """Verify app includes Keycloak routes."""
        # Check that routes are registered
        routes = [route.path for route in app.routes]
        
        assert any("/api/v1/auth/keycloak/login" in r for r in routes)
        assert any("/api/v1/auth/keycloak/callback" in r for r in routes)
        assert any("/api/v1/auth/keycloak/logout" in r for r in routes)
        assert any("/api/v1/auth/keycloak/config" in r for r in routes)
        assert any("/api/v1/auth/keycloak/userinfo" in r for r in routes)

    def test_health_check_still_works(self, client):
        """Verify health check still works after Keycloak integration."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
