#!/bin/bash

# Geo Dashboard - Universal Start Script
# Usage: ./start.sh [docker|k8s] [dev|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

show_help() {
    echo "Geo Dashboard - Universal Start Script"
    echo ""
    echo "Usage: $0 [PLATFORM] [MODE] [ACTION]"
    echo ""
    echo "PLATFORM:"
    echo "  docker    - Use Docker Compose (recommended for development)"
    echo "  k8s       - Use Kubernetes (recommended for production)"
    echo "  helm      - Use Helm Charts (turnkey deployment)"
    echo ""
    echo "MODE:"
    echo "  dev       - Development mode with hot reload"
    echo "  prod      - Production mode"
    echo ""
    echo "ACTION:"
    echo "  start     - Start the services"
    echo "  stop      - Stop the services"
    echo "  restart   - Restart the services"
    echo "  status    - Show service status"
    echo "  logs      - Show logs"
    echo "  install   - Install complete system (Kubernetes + Application)"
    echo ""
    echo "Examples:"
    echo "  $0 docker dev start    # Start development with Docker Compose"
    echo "  $0 k8s prod start      # Start production with Kubernetes"
    echo "  $0 helm prod install   # Turnkey installation with Helm"
    echo "  $0 docker dev logs     # Show development logs"
    echo ""
    echo "Quick Start (Interactive):"
    echo "  $0                     # Interactive mode"
    echo ""
    echo "Turnkey Installation:"
    echo "  ./install.sh           # Complete system installation"
}

# Interactive mode
interactive_mode() {
    log "Welcome to Geo Dashboard Setup!"
    echo ""
    
    # Choose platform
    echo "Choose your platform:"
    echo "1) Docker Compose (Recommended for development)"
    echo "2) Kubernetes (Recommended for production)"
    echo "3) Helm Charts (Turnkey deployment)"
    echo ""
    read -p "Enter choice [1-3]: " platform_choice
    
    case $platform_choice in
        1) PLATFORM="docker" ;;
        2) PLATFORM="k8s" ;;
        3) PLATFORM="helm" ;;
        *) error "Invalid choice. Please run again." ;;
    esac
    
    # Choose mode
    echo ""
    echo "Choose your mode:"
    echo "1) Development (Hot reload enabled)"
    echo "2) Production"
    echo ""
    read -p "Enter choice [1-2]: " mode_choice
    
    case $mode_choice in
        1) MODE="dev" ;;
        2) MODE="prod" ;;
        *) error "Invalid choice. Please run again." ;;
    esac
    
    # Choose action
    echo ""
    echo "Choose action:"
    echo "1) Start"
    echo "2) Stop"
    echo "3) Restart"
    echo "4) Status"
    echo "5) Logs"
    echo "6) Install (Complete system setup)"
    if [[ "$PLATFORM" == "helm" && "$MODE" == "dev" ]]; then
        echo "7) Setup Hot Reload"
        echo ""
        read -p "Enter choice [1-7]: " action_choice
    else
        echo ""
        read -p "Enter choice [1-6]: " action_choice
    fi
    
    case $action_choice in
        1) ACTION="start" ;;
        2) ACTION="stop" ;;
        3) ACTION="restart" ;;
        4) ACTION="status" ;;
        5) ACTION="logs" ;;
        6) ACTION="install" ;;
        7) 
            if [[ "$PLATFORM" == "helm" && "$MODE" == "dev" ]]; then
                ACTION="setup-hot-reload"
            else
                error "Invalid choice. Please run again."
            fi
            ;;
        *) error "Invalid choice. Please run again." ;;
    esac
    
    log "Selected: $PLATFORM $MODE $ACTION"
    echo ""
}

# Docker Compose functions
docker_dev_start() {
    log "Starting Geo Dashboard with Docker Compose (Development Mode)"
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker and Docker Compose."
    fi
    
    # Use docker compose or docker-compose
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    
    $DOCKER_COMPOSE -f docker-compose.dev.yml up -d --build
    
    log "Services started successfully!"
    log "Frontend: http://localhost:3000 (Hot reload enabled)"
    log "Backend API: http://localhost:8000 (Hot reload enabled)"
    log "Admin Panel: http://localhost:8000/admin (admin/admin123)"
    log "Database: localhost:5432 (geouser/geopassword123)"
    log "Tiles: http://localhost:3001"
    log "Full App: http://localhost (via NGINX)"
}

docker_dev_stop() {
    log "Stopping Docker Compose development environment..."
    
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        docker compose -f docker-compose.dev.yml down
    else
        docker-compose -f docker-compose.dev.yml down
    fi
    
    log "Development environment stopped."
}

docker_dev_status() {
    log "Docker Compose Development Status:"
    
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        docker compose -f docker-compose.dev.yml ps
    else
        docker-compose -f docker-compose.dev.yml ps
    fi
}

docker_dev_logs() {
    log "Docker Compose Development Logs:"
    
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        docker compose -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.dev.yml logs -f
    fi
}

# Kubernetes functions
k8s_dev_start() {
    log "Starting Geo Dashboard with Kubernetes (Development Mode)"
    ./deploy.sh dev
}

k8s_prod_start() {
    log "Starting Geo Dashboard with Kubernetes (Production Mode)"
    ./deploy.sh start
}

k8s_stop() {
    log "Stopping Kubernetes deployment..."
    ./deploy.sh stop
}

k8s_status() {
    log "Kubernetes Status:"
    ./deploy.sh status
}

k8s_logs() {
    log "Kubernetes Logs:"
    kubectl logs -f deployment/core-app-dev -n geo-dashboard 2>/dev/null || kubectl logs -f deployment/core-app -n geo-dashboard
}

# Helm functions
helm_install() {
    log "Installing Geo Dashboard with Helm..."
    
    # Check if Helm is installed
    if ! command -v helm &> /dev/null; then
        error "Helm is not installed. Please install Helm first."
    fi
    
    # Add required repositories
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    
    # Install or upgrade the release
    helm upgrade --install geo-dashboard ./helm/geo-dashboard \
        --namespace geo-dashboard \
        --create-namespace \
        --wait \
        --timeout 10m
    
    log "Helm installation completed!"
    
    # Show access information
    helm_show_info
}

helm_start() {
    log "Starting Geo Dashboard with Helm..."
    helm_install
}

helm_dev_start() {
    log "Starting Geo Dashboard with Helm (Development + Hot Reload)..."
    
    # Check if Helm is installed
    if ! command -v helm &> /dev/null; then
        error "Helm is not installed. Please install Helm first."
    fi
    
    # Check if hot reload setup exists
    if [[ ! -f "helm/geo-dashboard/values-dev-local.yaml" ]]; then
        warn "Hot reload not configured. Running setup..."
        ./setup-hot-reload.sh
    fi
    
    # Add required repositories
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    
    # Install or upgrade the release with development values
    helm upgrade --install geo-dashboard-dev ./helm/geo-dashboard \
        --namespace geo-dashboard-dev \
        --create-namespace \
        --values ./helm/geo-dashboard/values-dev-local.yaml \
        --wait \
        --timeout 10m
    
    log "🔥 Development environment with hot reload started!"
    
    # Show access information
    helm_dev_show_info
}

helm_dev_show_info() {
    log "🎉 Geo Dashboard development environment ready!"
    echo ""
    
    # Get cluster IP
    CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "127.0.0.1")
    
    echo -e "${GREEN}🔥 Hot Reload Features:${NC}"
    echo -e "  ⚡ Real-time backend reloading (Django)"
    echo -e "  ⚡ Real-time frontend reloading (React)"
    echo -e "  🔍 Source maps enabled"
    echo -e "  📊 Django debug toolbar"
    echo -e "  🚀 Fast refresh for React"
    echo ""
    echo -e "${GREEN}Access Information:${NC}"
    echo -e "  🌐 Web Interface: http://geo-dashboard.local"
    echo -e "  📊 Admin Panel: http://geo-dashboard.local/admin"
    echo -e "  🗺️  Tiles Endpoint: http://geo-dashboard.local/tiles"
    echo ""
    echo -e "${BLUE}Development Commands:${NC}"
    echo -e "  ./dev-logs.sh backend                        # View backend logs"
    echo -e "  ./dev-logs.sh frontend                       # View frontend logs"
    echo -e "  kubectl get pods -n geo-dashboard-dev        # Check pod status"
    echo -e "  ./stop-dev.sh                                # Stop development"
    echo ""
    echo -e "${YELLOW}Setup Required:${NC}"
    echo -e "  Add to /etc/hosts: $CLUSTER_IP geo-dashboard.local"
    echo ""
}

helm_stop() {
    log "Stopping Helm deployment..."
    helm uninstall geo-dashboard -n geo-dashboard
    kubectl delete namespace geo-dashboard
}

helm_status() {
    log "Helm Status:"
    helm status geo-dashboard -n geo-dashboard
    echo ""
    log "Pod Status:"
    kubectl get pods -n geo-dashboard
}

helm_logs() {
    log "Helm Deployment Logs:"
    kubectl logs -f deployment/geo-dashboard-core -n geo-dashboard
}

helm_show_info() {
    log "🎉 Geo Dashboard deployed successfully with Helm!"
    echo ""
    
    # Get ingress info
    INGRESS_IP=$(kubectl get ingress geo-dashboard -n geo-dashboard -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    INGRESS_HOST=$(kubectl get ingress geo-dashboard -n geo-dashboard -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "geo-dashboard.local")
    
    if [[ -z "$INGRESS_IP" ]]; then
        INGRESS_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' 2>/dev/null || kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    fi
    
    echo -e "${GREEN}Access Information:${NC}"
    echo -e "  🌐 Web Interface: http://$INGRESS_HOST"
    echo -e "  📊 Admin Panel: http://$INGRESS_HOST/admin"
    echo -e "  🗺️  Tiles Endpoint: http://$INGRESS_HOST/tiles"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  helm status geo-dashboard -n geo-dashboard    # Check deployment status"
    echo -e "  kubectl get pods -n geo-dashboard             # Check pod status"
    echo -e "  kubectl logs -f deployment/geo-dashboard-core -n geo-dashboard  # View logs"
    echo ""
    
    if [[ "$INGRESS_HOST" == "geo-dashboard.local" ]]; then
        echo -e "${YELLOW}Note: Add the following to your /etc/hosts file:${NC}"
        echo -e "  $INGRESS_IP geo-dashboard.local"
        echo ""
    fi
}

# Main execution
PLATFORM=${1:-}
MODE=${2:-}
ACTION=${3:-}

# If no arguments provided, run interactive mode
if [[ -z "$PLATFORM" && -z "$MODE" && -z "$ACTION" ]]; then
    interactive_mode
fi

# Handle help
if [[ "$PLATFORM" == "help" || "$PLATFORM" == "-h" || "$PLATFORM" == "--help" ]]; then
    show_help
    exit 0
fi

# Validate inputs
if [[ ! "$PLATFORM" =~ ^(docker|k8s|helm)$ ]]; then
    error "Invalid platform. Use 'docker', 'k8s', or 'helm'. Run '$0 help' for more info."
fi

if [[ ! "$MODE" =~ ^(dev|prod)$ ]]; then
    error "Invalid mode. Use 'dev' or 'prod'. Run '$0 help' for more info."
fi

if [[ ! "$ACTION" =~ ^(start|stop|restart|status|logs|install|setup-hot-reload)$ ]]; then
    error "Invalid action. Use 'start', 'stop', 'restart', 'status', 'logs', 'install', or 'setup-hot-reload'. Run '$0 help' for more info."
fi

# Execute based on platform, mode, and action
case "$PLATFORM-$MODE-$ACTION" in
    "docker-dev-start")
        docker_dev_start
        ;;
    "docker-dev-stop")
        docker_dev_stop
        ;;
    "docker-dev-restart")
        docker_dev_stop
        sleep 3
        docker_dev_start
        ;;
    "docker-dev-status")
        docker_dev_status
        ;;
    "docker-dev-logs")
        docker_dev_logs
        ;;
    "docker-prod-"*)
        warn "Docker Compose production mode not implemented. Use Kubernetes for production."
        warn "Run: $0 k8s prod $ACTION"
        ;;
    "k8s-dev-start")
        k8s_dev_start
        ;;
    "k8s-prod-start")
        k8s_prod_start
        ;;
    "k8s-"*"-stop")
        k8s_stop
        ;;
    "k8s-"*"-restart")
        k8s_stop
        sleep 5
        if [[ "$MODE" == "dev" ]]; then
            k8s_dev_start
        else
            k8s_prod_start
        fi
        ;;
    "k8s-"*"-status")
        k8s_status
        ;;
    "k8s-"*"-logs")
        k8s_logs
        ;;
    "helm-dev-start"|"helm-dev-install")
        helm_dev_start
        ;;
    "helm-prod-start"|"helm-prod-install")
        helm_start
        ;;
    "helm-"*"-start"|"helm-"*"-install")
        if [[ "$MODE" == "dev" ]]; then
            helm_dev_start
        else
            helm_start
        fi
        ;;
    "helm-"*"-stop")
        helm_stop
        ;;
    "helm-"*"-restart")
        helm_stop
        sleep 5
        if [[ "$MODE" == "dev" ]]; then
            helm_dev_start
        else
            helm_start
        fi
        ;;
    "helm-"*"-status")
        helm_status
        ;;
    "helm-"*"-logs")
        helm_logs
        ;;
    "*-setup-hot-reload")
        log "Setting up hot reload for development..."
        ./setup-hot-reload.sh
        ;;
    *)
        error "Unsupported combination: $PLATFORM $MODE $ACTION"
        ;;
esac 