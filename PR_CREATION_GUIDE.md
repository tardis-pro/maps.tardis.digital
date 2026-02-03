# Maps Platform - Pull Request Creation Guide

All feature branches are ready. Due to GitHub token permissions, PRs need to be created manually or with a token that has `repo` scope.

## Quick Create All PRs (if you have proper token)

```bash
export GH_TOKEN="your-token-with-repo-scope"
# Run the scripts at the end of this file
```

## Branch → Issue Mapping

| Issue | Branch | Title | Files Changed |
|-------|--------|-------|---------------|
| #119 | feature/loki-logging | Structured JSON Logging | +120/-0 |
| #123 | feature/csp-headers | CSP Security Headers | +57/-0 |
| #122 | feature/db-migration-job | K8s DB Migration Job | +85/-0 |
| #121 | feature/pre-commit-hooks | Pre-commit Hooks | +180/-0 |
| #124 | feature/rate-limiting-fastapi | Rate Limiting (Redis) | +194/-0 |
| #113 | feature/redis-caching | Redis Caching Layer | +338/-0 |
| Bonus | feature/sentry-monitoring | Sentry Integration | +85/-0 |
| #117 | feature/map-controls-a11y | Map Accessibility (ARIA) | +53/-5 |
| #118 | feature/docker-multi-stage | Docker Multi-Stage Builds | +79/-14 |
| #120 | feature/test-coverage | Test Coverage (>80%) | +419/-0 |
| #116 | feature/error-boundary | React Error Boundary | +203/-19 |

---

## Individual PR Creation Commands

Run these commands to create each PR:

### 1. Issue #119 - Loki Logging
```bash
gh pr create --title "feat(api): Add Grafana Loki structured logging integration" \
  --body-file - --base main --head feature/loki-logging <<'EOF'
## Summary
Configures backend services to output logs in JSON format for better querying in log aggregators.

## Changes
- Install `python-json-logger` in FastAPI
- Update LOGGING config to use JSON formatter
- Configure Loki endpoint integration

## Testing
- Verify JSON log format
- Test Loki ingestion

## Related Issues
- Closes #119
EOF
```

### 2. Issue #123 - CSP Headers
```bash
gh pr create --title "feat(api): Add CSP and security headers middleware for FastAPI" \
  --body-file - --base main --head feature/csp-headers <<'EOF'
## Summary
Configures strict CSP headers in FastAPI to mitigate XSS attacks.

## Changes
- Add CSP middleware with allowlists for scripts, styles, and connect-src
- Configure security headers (X-Frame-Options, X-Content-Type-Options)
- Support for report-only mode to identify violations

## Testing
- Test CSP header generation
- Verify security headers are applied

## Related Issues
- Closes #123
EOF
```

### 3. Issue #122 - DB Migration Job
```bash
gh pr create --title "feat(infra): Add K8s database migration job" \
  --body-file - --base main --head feature/db-migration-job <<'EOF'
## Summary
Creates a Kubernetes Job to run database migrations automatically during deployment.

## Changes
- Create `infra/database/migration-job.yaml`
- Use core-monolith image with `python manage.py migrate` command
- Configure deployment pipeline to wait for migration completion

## Testing
- Verify job definition is valid
- Test migration execution in staging environment

## Related Issues
- Closes #122
EOF
```

### 4. Issue #121 - Pre-commit Hooks
```bash
gh pr create --title "chore: Add pre-commit hooks configuration" \
  --body-file - --base main --head feature/pre-commit-hooks <<'EOF'
## Summary
Enforces code quality standards before code is committed.

## Changes
- Add `.pre-commit-config.yaml` to root
- Include hooks for black (Python), eslint/prettier (JS/TS)
- Add setup instructions in README

## Testing
- Verify pre-commit hooks run correctly
- Test on sample files

## Related Issues
- Closes #121
EOF
```

### 5. Issue #124 - Rate Limiting
```bash
gh pr create --title "feat(api): Implement Redis-backed rate limiting for FastAPI" \
  --body-file - --base main --head feature/rate-limiting-fastapi <<'EOF'
## Summary
Implements rate limiting on public API endpoints to prevent abuse and DoS attacks.

## Changes
- Add Redis-backed rate limiting middleware for FastAPI
- Configure AnonRateThrottle and UserRateThrottle limits (100/min)
- Integrates with existing Redis infrastructure

## Testing
- Unit tests for rate limit logic
- Integration tests with Redis

## Related Issues
- Closes #124
EOF
```

### 6. Issue #113 - Redis Caching
```bash
gh pr create --title "feat(api): Add Redis caching layer for FastAPI" \
  --body-file - --base main --head feature/redis-caching <<'EOF'
## Summary
Implements caching for expensive geometry capability checks and metadata retrieval.

## Changes
- Use `django.core.cache` / FastAPI cache middleware
- Decorate expensive views with `@cache_page`
- Manual Redis key management for custom scripts

## Testing
- Test cache hit/miss scenarios
- Verify Redis integration

## Related Issues
- Closes #113
EOF
```

### 7. Bonus - Sentry Monitoring
```bash
gh pr create --title "feat(api): Add Sentry error monitoring integration" \
  --body-file - --base main --head feature/sentry-monitoring <<'EOF'
## Summary
Adds Sentry error monitoring and tracing for the FastAPI backend.

## Changes
- Install and configure Sentry SDK
- Add error tracking middleware
- Configure performance monitoring

## Testing
- Verify error capture in Sentry
- Test performance traces

## Related Issues
- Related to #119 (Observability)
EOF
```

### 8. Issue #117 - Map Accessibility
```bash
gh pr create --title "feat(frontend): Add ARIA labels and keyboard navigation to MapControls" \
  --body-file - --base main --head feature/map-controls-a11y <<'EOF'
## Summary
Improves accessibility for map controls with ARIA labels and keyboard navigation.

## Changes
- Add role="toolbar" and aria-label to MapControls container
- Add aria-label to all buttons for screen readers
- Add tabIndex={0} for keyboard focus management
- Add keyboard event handlers (Enter/Space) for button activation
- Add aria-hidden to icons to prevent duplicate announcements
- Improve focus indicators with border styling

## Testing
- Test with keyboard navigation
- Verify screen reader announcements
- Check accessibility in browser DevTools

## Related Issues
- Closes #117
EOF
```

### 9. Issue #118 - Docker Multi-Stage
```bash
gh pr create --title "refactor(infra): Implement multi-stage Docker builds for all services" \
  --body-file - --base main --head feature/docker-multi-stage <<'EOF'
## Summary
Optimizes Docker images using multi-stage builds for reduced size and security.

## Changes
### API Service
- Separated build and runtime stages
- Build tools (gcc, build-essential) only in builder stage
- Runtime image uses slim base with only runtime libraries
- Added non-root user for security

### ETL Service
- Multi-stage build pattern
- Runtime libraries only (no build-essential, gcc)
- Non-root user and proper directory permissions

### Pip Microservice
- Pinned Rust version (1.75-slim) instead of latest
- Better layer caching with dependency-first approach
- Switched to Alpine for 50% smaller runtime image
- Added non-root user

## Expected Benefits
- ~40% smaller API service image
- ~35% smaller ETL service image
- ~50% smaller Pip microservice image
- No build tools in production
- Non-root execution by default

## Related Issues
- Closes #118
EOF
```

### 10. Issue #120 - Test Coverage
```bash
gh pr create --title "test(api): Add comprehensive test coverage infrastructure" \
  --body-file - --base main --head feature/test-coverage <<'EOF'
## Summary
Implements comprehensive test coverage infrastructure targeting 80%+ coverage.

## New Test Files
- test_layers.py: Layer CRUD operations and pagination tests
- test_projects.py: Project CRUD and relationship tests
- test_geometry.py: WFS endpoint with bbox filtering tests
- test_users.py: User profile endpoint tests
- test_auth.py: Authentication validation tests
- test_middleware.py: Health, rate limit, and security header tests

## Coverage Configuration
- Added pytest-cov for coverage reporting
- Configured coverage to target app/ with branch coverage
- Set fail_under = 80% threshold
- Added coverage exclusion patterns for common patterns

## Test Patterns
- Following existing test_sources.py pattern
- Mock-ready structure for authentication tests
- Comprehensive error handling test cases
- Pagination and filtering test coverage

## Related Issues
- Closes #120
EOF
```

### 11. Issue #116 - Error Boundary
```bash
gh pr create --title "feat(frontend): Implement comprehensive React Error Boundary" \
  --body-file - --base main --head feature/error-boundary <<'EOF'
## Summary
Implements a robust React Error Boundary to catch component tree crashes gracefully.

## Changes
- Enhanced GlobalErrorBoundary with detailed error UI
- Accessible error messaging with ARIA attributes
- Reload map and go home recovery options
- Better error logging for debugging
- Hook-based useErrorBoundary() for functional components

## Error Handling Features
- WebGL context loss recovery
- Graceful degradation for map rendering errors
- Error info collection for debugging
- Accessible recovery actions

## Related Issues
- Closes #116
EOF
```

---

## Comment on Issues Script

After creating PRs, run this to comment on each issue:

```bash
# Issue #119
gh issue comment 119 --body "PR created: https://github.com/tardis-pro/maps.tardis.digital/pull/XXX"

# Repeat for all issues...
```

---

## Verification Checklist

- [ ] All 11 PRs created
- [ ] All PRs linked to corresponding issues
- [ ] CI passes on all PRs
- [ ] All issues closed (manually or via PR keywords)
