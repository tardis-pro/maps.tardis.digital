#!/bin/bash

# Start development environment with hot reload

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

log "🔥 Starting Geo Dashboard with Hot Reload..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if helm is available
if ! command -v helm &> /dev/null; then
    echo "❌ Helm not found. Please install Helm first."
    exit 1
fi

# Add required repositories
log "Adding Helm repositories..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Deploy with development values
log "Deploying with hot reload enabled..."
helm upgrade --install geo-dashboard-dev ./helm/geo-dashboard \
    --namespace geo-dashboard-dev \
    --create-namespace \
    --values ./helm/geo-dashboard/values-dev-local.yaml \
    --wait \
    --timeout 10m

log "🎉 Development environment started!"
info "Access your application at: http://geo-dashboard.local"
info "Add to /etc/hosts: $(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}') geo-dashboard.local"

echo ""
echo "🔧 Development Commands:"
echo "  kubectl get pods -n geo-dashboard-dev    # Check pod status"
echo "  kubectl logs -f deployment/geo-dashboard-dev-core -n geo-dashboard-dev    # View backend logs"
echo "  kubectl logs -f deployment/geo-dashboard-dev-frontend -n geo-dashboard-dev # View frontend logs"
echo "  helm uninstall geo-dashboard-dev -n geo-dashboard-dev                     # Stop development"
