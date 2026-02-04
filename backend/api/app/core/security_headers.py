"""
Security Headers Middleware for FastAPI.

This module provides comprehensive security headers including:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy

These headers protect against common web vulnerabilities like XSS,
clickjacking, and information leakage.
"""

import logging
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class SecurityHeaderConfig(BaseModel):
    """
    Configuration for individual security headers.
    
    All headers are optional and will only be set if configured.
    """
    # Content Security Policy
    csp_default_src: List[str] = Field(
        default=["'self'"],
        description="Default source for content"
    )
    csp_script_src: List[str] = Field(
        default=["'self'"],
        description="Allowed script sources"
    )
    csp_style_src: List[str] = Field(
        default=["'self'", "'unsafe-inline'"],
        description="Allowed style sources"
    )
    csp_img_src: List[str] = Field(
        default=["'self'", "data:"],
        description="Allowed image sources"
    )
    csp_font_src: List[str] = Field(
        default=["'self'"],
        description="Allowed font sources"
    )
    csp_connect_src: List[str] = Field(
        default=["'self'"],
        description="Allowed connection targets"
    )
    csp_frame_src: List[str] = Field(
        default=["'none'"],
        description="Allowed frame sources"
    )
    csp_base_uri: List[str] = Field(
        default=["'self'"],
        description="Allowed base URIs"
    )
    csp_form_action: List[str] = Field(
        default=["'self'"],
        description="Allowed form action targets"
    )
    csp_upgrade_insecure_requests: bool = Field(
        default=True,
        description="Upgrade HTTP to HTTPS"
    )
    csp_report_uri: Optional[str] = Field(
        default=None,
        description="CSP violation report URI"
    )
    
    # HSTS Configuration
    hsts_enabled: bool = Field(
        default=True,
        description="Enable HSTS header"
    )
    hsts_max_age_seconds: int = Field(
        default=31536000,  # 1 year
        description="HSTS max-age in seconds"
    )
    hsts_include_subdomains: bool = Field(
        default=True,
        description="Include subdomains in HSTS"
    )
    hsts_preload: bool = Field(
        default=False,
        description="Allow HSTS preload"
    )
    
    # Other Security Headers
    x_content_type_options: str = Field(
        default="nosniff",
        description="X-Content-Type-Options value"
    )
    x_frame_options: str = Field(
        default="DENY",
        description="X-Frame-Options value"
    )
    referrer_policy: str = Field(
        default="strict-origin-when-cross-origin",
        description="Referrer-Policy value"
    )
    permissions_policy: Dict[str, List[str]] = Field(
        default_factory=lambda: {
            "geolocation": ["()"],
            "camera": ["()"],
            "microphone": ["()"],
            "payment": ["()"],
        },
        description="Permissions-Policy directives"
    )


def build_csp_header(config: SecurityHeaderConfig) -> str:
    """
    Build the Content-Security-Policy header value from configuration.
    
    Args:
        config: Security header configuration
    
    Returns:
        CSP header value as string
    """
    directives = []
    
    # Build each CSP directive
    directives.append(f"default-src { ' '.join(config.csp_default_src) }")
    directives.append(f"script-src { ' '.join(config.csp_script_src) }")
    directives.append(f"style-src { ' '.join(config.csp_style_src) }")
    directives.append(f"img-src { ' '.join(config.csp_img_src) }")
    directives.append(f"font-src { ' '.join(config.csp_font_src) }")
    directives.append(f"connect-src { ' '.join(config.csp_connect_src) }")
    directives.append(f"frame-src { ' '.join(config.csp_frame_src) }")
    directives.append(f"base-uri { ' '.join(config.csp_base_uri) }")
    directives.append(f"form-action { ' '.join(config.csp_form_action) }")
    
    if config.csp_upgrade_insecure_requests:
        directives.append("upgrade-insecure-requests")
    
    if config.csp_report_uri:
        directives.append(f"report-uri {config.csp_report_uri}")
    
    return "; ".join(directives)


def build_hsts_header(config: SecurityHeaderConfig) -> str:
    """
    Build the Strict-Transport-Security header value.
    
    Args:
        config: Security header configuration
    
    Returns:
        HSTS header value as string
    """
    if not config.hsts_enabled:
        return None
    
    parts = [f"max-age={config.hsts_max_age_seconds}"]
    
    if config.hsts_include_subdomains:
        parts.append("includeSubDomains")
    
    if config.hsts_preload:
        parts.append("preload")
    
    return "; ".join(parts)


def build_permissions_policy_header(config: SecurityHeaderConfig) -> str:
    """
    Build the Permissions-Policy header value.
    
    Args:
        config: Security header configuration
    
    Returns:
        Permissions-Policy header value as string
    """
    directives = []
    for feature, allowlist in config.permissions_policy.items():
        directives.append(f"{feature}={', '.join(allowlist)}")
    
    return ", ".join(directives)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses.
    
    This middleware provides defense-in-depth by adding multiple security
    headers that protect against common web vulnerabilities.
    
    Usage:
        from fastapi import FastAPI
        from app.core.security_headers import SecurityHeadersMiddleware, get_security_config
        
        app = FastAPI()
        config = get_security_config()
        app.add_middleware(SecurityHeadersMiddleware, config=config)
    """
    
    def __init__(self, app, config: Optional[SecurityHeaderConfig] = None):
        """
        Initialize the security headers middleware.
        
        Args:
            app: The ASGI application
            config: Optional security header configuration (uses default if not provided)
        """
        super().__init__(app)
        self.config = config or SecurityHeaderConfig()
    
        """
        Process the request and add security headers to the response.
        
        Args:
            request: The incoming request
            call_next: The next middleware/handler in the chain
        
        Returns:
            Response with security headers added
        """
        
        # Skip headers for non-HTML responses (e.g., images, API JSON)
        content_type = response.headers.get("content-type", "")
        if not any(ct in content_type for ct in ["text/html", "application/xml", "application/xhtml+xml"]):
            return response
        
        # Add CSP header
        csp_value = build_csp_header(self.config)
        if csp_value:
            response.headers["Content-Security-Policy"] = csp_value
        
        # Add HSTS header (only for HTTPS requests)
        if request.url.scheme == "https":
            hsts_value = build_hsts_header(self.config)
            if hsts_value:
                response.headers["Strict-Transport-Security"] = hsts_value
        
        # Add other security headers
        response.headers["X-Content-Type-Options"] = self.config.x_content_type_options
        response.headers["X-Frame-Options"] = self.config.x_frame_options
        response.headers["Referrer-Policy"] = self.config.referrer_policy
        
        # Add Permissions-Policy header
        permissions_value = build_permissions_policy_header(self.config)
        response.headers["Permissions-Policy"] = permissions_value
        
        # Add additional security headers
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        
        return response


def get_security_config(
    environment: str = "development",
    cdn_domains: Optional[List[str]] = None,
    api_domains: Optional[List[str]] = None,
) -> SecurityHeaderConfig:
    """
    Get security header configuration for the specified environment.
    
    Args:
        environment: deployment environment (development/staging/production)
        cdn_domains: list of trusted CDN domains for scripts/styles
        api_domains: list of trusted API domains for connect-src
    
    Returns:
        Configured SecurityHeaderConfig instance
    """
    # Build trusted sources based on environment
    script_sources = ["'self'"]
    style_sources = ["'self'", "'unsafe-inline'"]
    image_sources = ["'self'", "data:"]
    connect_sources = ["'self'"]
    
    if cdn_domains:
        script_sources.extend(cdn_domains)
        style_sources.extend(cdn_domains)
    
    if api_domains:
        connect_sources.extend(api_domains)
    
    # Production environment gets stricter settings
    if environment == "production":
        # Remove unsafe-inline for scripts in production
        # (requires nonce-based or hash-based approach)
        style_sources = ["'self'"]
        image_sources = ["'self'"]
        
        # Add report-uri for CSP violations in production
        report_uri = "/api/v1/security/csp-report"
    else:
        report_uri = None
    
    return SecurityHeaderConfig(
        csp_script_src=script_sources,
        csp_style_src=style_sources,
        csp_img_src=image_sources,
        csp_connect_src=connect_sources,
        csp_report_uri=report_uri,
        hsts_enabled=(environment == "production"),
        hsts_preload=(environment == "production"),
    )


class ContentSecurityPolicyReportOnlyMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds CSP in report-only mode.
    
    This middleware is useful for testing CSP policies before enforcing them.
    It reports violations but doesn't block content.
    
    Usage:
        # Add this middleware alongside the enforced CSP for testing
        app.add_middleware(
            ContentSecurityPolicyReportOnlyMiddleware,
            report_endpoint="/api/v1/security/csp-report-only"
        )
    """
    
    def __init__(self, app, report_endpoint: str = "/csp-report"):
        super().__init__(app)
        self.report_endpoint = report_endpoint
    
        
        # Only add to HTML responses
        content_type = response.headers.get("content-type", "")
        if not any(ct in content_type for ct in ["text/html", "application/xml"]):
            return response
        
        # Build a strict CSP for report-only mode
        csp_report_only = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "form-action 'self'; "
            f"report-uri {self.report_endpoint}"
        )
        
        response.headers["Content-Security-Policy-Report-Only"] = csp_report_only
        
        return response
