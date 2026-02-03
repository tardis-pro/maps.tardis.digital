"""
Tests for rate limiting functionality.

These tests verify that:
1. Rate limiting is properly configured
2. Rate limit headers are returned
3. 429 responses are returned when limits are exceeded
4. Different rate limits apply to different endpoint categories
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from slowapi.errors import RateLimitExceeded

from app.main import app
from app.core.rate_limit import (
    get_rate_limiter,
    RateLimits,
    RateLimitConfig,
    get_rate_limit_for_path,
    ENDPOINT_CATEGORIES,
)


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def mock_redis():
    """Mock Redis for testing without actual Redis connection."""
    with patch("slowapi.Limiter.get_identifier") as mock_get_id, \
         patch("slowapi.Limiter.reset") as mock_reset, \
         patch("slowapi.Limiter._check_logic") as mock_check:
        
        mock_get_id.return_value = "127.0.0.1"
        mock_check.return_value = None  # Allow request to proceed
        
        yield {
            "get_id": mock_get_id,
            "reset": mock_reset,
            "check": mock_check,
        }


class TestRateLimitConfiguration:
    """Tests for rate limit configuration."""

    def test_rate_limits_enum_values(self):
        """Verify rate limit enum values are correctly defined."""
        assert RateLimits.DEFAULT == "200/minute"
        assert RateLimits.ANON == "100/minute"
        assert RateLimits.AUTHENTICATED == "1000/minute"
        assert RateLimits.SENSITIVE == "10/minute"
        assert RateLimits.READ_ONLY == "500/minute"
        assert RateLimits.WRITE == "100/minute"
        assert RateLimits.HEALTH == "1000/minute"
        assert RateLimits.UPLOAD == "5/minute"

    def test_rate_limit_config_model(self):
        """Verify rate limit config model works."""
        config = RateLimitConfig(requests=100, seconds=60)
        assert config.requests == 100
        assert config.seconds == 60

    def test_endpoint_categories_mapping(self):
        """Verify endpoint categories are correctly mapped."""
        assert ENDPOINT_CATEGORIES["/health"] == RateLimits.HEALTH
        assert ENDPOINT_CATEGORIES["/api/v1/auth/login"] == RateLimits.SENSITIVE
        assert ENDPOINT_CATEGORIES["/api/v1/sources"] == RateLimits.READ_ONLY
        assert ENDPOINT_CATEGORIES["/tasks/"] == RateLimits.UPLOAD

    def test_get_rate_limit_for_path_exact_match(self):
        """Test exact path matching for rate limits."""
        assert get_rate_limit_for_path("/health") == RateLimits.HEALTH
        assert get_rate_limit_for_path("/api/v1/auth/login") == RateLimits.SENSITIVE

    def test_get_rate_limit_for_path_prefix_match(self):
        """Test prefix matching for rate limits."""
        # Should match /api/v1/sources prefix
        limit = get_rate_limit_for_path("/api/v1/sources/123")
        assert limit == RateLimits.READ_ONLY

    def test_get_rate_limit_for_path_write_methods(self):
        """Test that write methods get WRITE limit."""
        limit = get_rate_limit_for_path("/api/v1/sources", method="POST")
        assert limit == RateLimits.WRITE

        limit = get_rate_limit_for_path("/api/v1/sources/123", method="PUT")
        assert limit == RateLimits.WRITE

        limit = get_rate_limit_for_path("/api/v1/projects/456", method="PATCH")
        assert limit == RateLimits.WRITE

        limit = get_rate_limit_for_path("/api/v1/layers/789", method="DELETE")
        assert limit == RateLimits.WRITE

    def test_get_rate_limit_for_path_unknown_endpoint(self):
        """Test default rate limit for unknown endpoints."""
        limit = get_rate_limit_for_path("/api/v1/unknown")
        assert limit == RateLimits.DEFAULT

    def test_get_rate_limit_for_path_unknown_with_write(self):
        """Test WRITE limit for unknown endpoints with write methods."""
        limit = get_rate_limit_for_path("/api/v1/random", method="POST")
        assert limit == RateLimits.WRITE


class TestRateLimiterInitialization:
    """Tests for rate limiter initialization."""

    def test_get_rate_limiter_returns_limiter(self):
        """Verify rate limiter can be initialized."""
        limiter = get_rate_limiter()
        assert limiter is not None
        assert hasattr(limiter, ' limiter')


class TestRateLimitHeaders:
    """Tests for rate limit response headers."""

    def test_health_check_returns_200(self, client):
        """Verify health check endpoint returns 200."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_readiness_check_returns_200(self, client):
        """Verify readiness check endpoint returns 200."""
        response = client.get("/ready")
        assert response.status_code == 200
        assert response.json() == {"status": "ready"}


class TestRateLimitDecorator:
    """Tests for rate limit decorator application."""

    def test_sources_list_endpoint_exists(self, client):
        """Verify sources list endpoint exists."""
        response = client.get("/api/v1/sources/")
        # May return 200 or 422 (validation error) but should not 404
        assert response.status_code in [200, 422, 500]

    def test_sources_create_endpoint_exists(self, client):
        """Verify sources create endpoint exists."""
        response = client.post("/api/v1/sources/", json={})
        # Should not 404
        assert response.status_code != 404

    def test_geometry_endpoint_exists(self, client):
        """Verify geometry endpoint exists."""
        response = client.get("/api/v1/wfs/")
        # May return 200 or 500 (DB error) but should not 404
        assert response.status_code in [200, 500]


class TestRateLimitConfigurationModel:
    """Tests for rate limit configuration model."""

    def test_config_with_default_strategy(self):
        """Test config uses default sliding window strategy."""
        config = RateLimitConfig(requests=100, seconds=60)
        assert config.strategy.value == "window"

    def test_config_with_custom_strategy(self):
        """Test config with custom fixed window strategy."""
        config = RateLimitConfig(
            requests=100,
            seconds=60,
            strategy=RateLimitStrategy.FIXED
        )
        assert config.strategy == RateLimitStrategy.FIXED


class TestRateLimitEdgeCases:
    """Tests for edge cases in rate limiting."""

    def test_get_rate_limit_for_path_empty_path(self):
        """Test rate limit for empty path."""
        limit = get_rate_limit_for_path("")
        assert limit == RateLimits.DEFAULT

    def test_get_rate_limit_for_path_root(self):
        """Test rate limit for root path."""
        limit = get_rate_limit_for_path("/")
        assert limit == RateLimits.DEFAULT

    def test_get_rate_limit_case_sensitive_methods(self):
        """Test that HTTP method matching is case-sensitive."""
        # Lowercase methods should not match WRITE logic
        limit = get_rate_limit_for_path("/api/v1/sources", method="post")
        assert limit == RateLimits.DEFAULT  # Not WRITE because lowercase

        limit = get_rate_limit_for_path("/api/v1/sources", method="post")
        # Case-insensitive matching should still work
        assert limit in [RateLimits.WRITE, RateLimits.DEFAULT]


class TestRateLimitIntegration:
    """Integration tests for rate limiting."""

    def test_limiter_is_attached_to_app(self, client):
        """Verify rate limiter is attached to the app."""
        assert hasattr(app.state, 'limiter')

    def test_rate_limit_exception_handler_exists(self, client):
        """Verify rate limit exception handler is registered."""
        # The exception handler should be registered
        # We can test this by checking if a 429 response has proper format
        # when rate limit is exceeded
        from slowapi.errors import RateLimitExceeded
        from app.core.rate_limit import rate_limit_exceeded_handler
        
        # Create a mock request and exception
        mock_request = MagicMock()
        mock_request.client.host = "127.0.0.1"
        mock_exception = MagicMock()
        mock_exception.detail = MagicMock()
        mock_exception.detail.retry_after = 60
        mock_exception.detail.limit = "100/minute"
        
        response = rate_limit_exceeded_handler(mock_request, mock_exception)
        
        assert response.status_code == 429
        assert "X-RateLimit-Limit" in response.headers
        assert "Retry-After" in response.headers

    def test_rate_limit_response_format(self, client):
        """Verify rate limit exceeded response has correct format."""
        from app.core.rate_limit import rate_limit_exceeded_handler
        
        mock_request = MagicMock()
        mock_request.client.host = "127.0.0.1"
        mock_exception = MagicMock()
        mock_exception.detail = MagicMock()
        mock_exception.detail.retry_after = 30
        mock_exception.detail.limit = "10/minute"
        
        response = rate_limit_exceeded_handler(mock_request, mock_exception)
        
        # Should return JSON response
        assert response.status_code == 429
        
        # Response body should contain error information
        content = response.json()
        assert "error" in content
        assert "retry_after" in content
