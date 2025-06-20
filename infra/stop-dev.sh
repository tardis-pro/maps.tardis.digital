#!/bin/bash

# Stop development environment

set -e

GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log "🛑 Stopping development environment..."

helm uninstall geo-dashboard-dev -n geo-dashboard-dev 2>/dev/null || true
kubectl delete namespace geo-dashboard-dev 2>/dev/null || true

log "✓ Development environment stopped"
