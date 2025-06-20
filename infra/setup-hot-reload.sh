#!/bin/bash

# Geo Dashboard - Hot Reload Setup Script
# This script configures hot reloading for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

show_banner() {
    echo -e "${BLUE}"
    cat << "EOF"
   🔥 Hot Reload Setup for Geo Dashboard 🔥
   
   This script will configure your development environment
   for real-time code reloading with Kubernetes!
EOF
    echo -e "${NC}"
}

detect_project_structure() {
    log "Detecting project structure..."
    
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    FRONTEND_PATH=""
    BACKEND_PATH=""
    
    # Try to find frontend directory
    if [[ -d "$PROJECT_ROOT/frontend" ]]; then
        FRONTEND_PATH="$PROJECT_ROOT/frontend"
    elif [[ -d "$PROJECT_ROOT/client" ]]; then
        FRONTEND_PATH="$PROJECT_ROOT/client"
    elif [[ -d "$PROJECT_ROOT/ui" ]]; then
        FRONTEND_PATH="$PROJECT_ROOT/ui"
    fi
    
    # Try to find backend directory
    if [[ -d "$PROJECT_ROOT/backend" ]]; then
        BACKEND_PATH="$PROJECT_ROOT/backend"
    elif [[ -d "$PROJECT_ROOT/server" ]]; then
        BACKEND_PATH="$PROJECT_ROOT/server"
    elif [[ -d "$PROJECT_ROOT/api" ]]; then
        BACKEND_PATH="$PROJECT_ROOT/api"
    fi
    
    log "Project root: $PROJECT_ROOT"
    log "Frontend path: ${FRONTEND_PATH:-'Not found'}"
    log "Backend path: ${BACKEND_PATH:-'Not found'}"
}

create_dev_values() {
    log "Creating customized development values..."
    
    # Create a personalized dev values file
    cat > helm/geo-dashboard/values-dev-local.yaml << EOF
# Auto-generated development values with hot reload
# Generated on: $(date)

# Enable development mode
development:
  enabled: true
  hotReload: true
  debugMode: true
  
  # Hot reload configuration
  hotReloadConfig:
    watchFiles: true
    pollInterval: 1
    watchPaths:
      - "/app/src"
      - "/app/frontend/src" 
      - "/app/backend"
      - "/app/templates"
      - "/app/static"
    watchExtensions:
      - ".py"
      - ".js"
      - ".jsx"
      - ".ts"
      - ".tsx"
      - ".css"
      - ".scss"
      - ".html"
      - ".json"
      - ".yaml"
      - ".yml"
    
  # Development tools
  devTools:
    djangoDebugToolbar: true
    reactDevTools: true
    hmr: true
    sourceMaps: true
    verboseLogging: true

# Core application overrides for development
core:
  image:
    repository: pronittardis/core-app
    tag: "dev"
    pullPolicy: Always
  
  replicaCount: 1
  
  env:
    DJANGO_DEBUG: "True"
    DJANGO_ALLOWED_HOSTS: "*"
    DJANGO_SETTINGS_MODULE: "core.settings.development"
    PYTHONUNBUFFERED: "1"
    WATCHDOG_ENABLED: "1"
    HOT_RELOAD: "1"
  
  # Development command override
  command:
    - "/bin/bash"
    - "-c"
    - |
      echo "🔥 Starting Django development server with hot reload..."
      pip install watchdog django-extensions
      python manage.py collectstatic --noinput
      python manage.py migrate
      python manage.py runserver_plus 0.0.0.0:8000 --reloader-type watchdog
EOF

    # Add volume mounts if paths are found
    if [[ -n "$BACKEND_PATH" ]]; then
        cat >> helm/geo-dashboard/values-dev-local.yaml << EOF
  
  # Volume mounts for live code editing
  volumeMounts:
    - name: backend-source
      mountPath: /app
      readOnly: false
  
  volumes:
    - name: backend-source
      hostPath:
        path: $BACKEND_PATH
        type: Directory
EOF
    fi

    # Frontend configuration
    cat >> helm/geo-dashboard/values-dev-local.yaml << EOF

# Frontend overrides for development
frontend:
  image:
    repository: pronittardis/frontend-app
    tag: "dev"
    pullPolicy: Always
  
  replicaCount: 1
  
  env:
    NODE_ENV: "development"
    REACT_APP_API_URL: "http://geo-dashboard.local/api"
    FAST_REFRESH: "true"
    WDS_SOCKET_HOST: "geo-dashboard.local"
    WDS_SOCKET_PORT: "3000"
    CHOKIDAR_USEPOLLING: "true"
    WATCHPACK_POLLING: "true"
    GENERATE_SOURCEMAP: "true"
  
  # Development command override
  command:
    - "/bin/bash"
    - "-c"
    - |
      echo "🔥 Starting React development server with hot reload..."
      npm install
      npm run start
EOF

    # Add frontend volume mounts if path is found
    if [[ -n "$FRONTEND_PATH" ]]; then
        cat >> helm/geo-dashboard/values-dev-local.yaml << EOF
  
  # Volume mounts for live code editing
  volumeMounts:
    - name: frontend-source
      mountPath: /app
      readOnly: false
    - name: node-modules
      mountPath: /app/node_modules
  
  volumes:
    - name: frontend-source
      hostPath:
        path: $FRONTEND_PATH
        type: Directory
    - name: node-modules
      emptyDir: {}
EOF
    fi

    # Add remaining configuration
    cat >> helm/geo-dashboard/values-dev-local.yaml << EOF

# PostgreSQL for development
postgresql:
  auth:
    postgresPassword: "devpassword123"
    username: "devuser"
    password: "devpassword123"
    database: "geodashboard_dev"
  
  primary:
    persistence:
      enabled: false

# Redis for development
redis:
  auth:
    enabled: false
  
  master:
    persistence:
      enabled: false

# Ingress for development with WebSocket support
ingress:
  enabled: true
  hosts:
    - host: geo-dashboard.local
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: core
        - path: /admin
          pathType: Prefix
          service: core
        - path: /tiles
          pathType: Prefix
          service: tiler
        - path: /sockjs-node
          pathType: Prefix
          service: frontend
        - path: /ws
          pathType: Prefix
          service: frontend
  
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    # Enable WebSocket support for hot reload
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header Upgrade \$http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host \$host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;

# Disable autoscaling and monitoring in development
autoscaling:
  enabled: false

monitoring:
  enabled: false

# More permissive security for development
securityContext:
  capabilities:
    drop: []
  readOnlyRootFilesystem: false
  runAsNonRoot: false
  runAsUser: 0
EOF

    log "✓ Created values-dev-local.yaml with hot reload configuration"
}

create_dev_scripts() {
    log "Creating development helper scripts..."
    
    # Create start-dev script
    cat > start-dev.sh << 'EOF'
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
EOF

    chmod +x start-dev.sh

    # Create stop-dev script
    cat > stop-dev.sh << 'EOF'
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
EOF

    chmod +x stop-dev.sh

    # Create logs script
    cat > dev-logs.sh << 'EOF'
#!/bin/bash

# View development logs

COMPONENT=${1:-all}

case $COMPONENT in
    backend|core)
        kubectl logs -f deployment/geo-dashboard-dev-core -n geo-dashboard-dev
        ;;
    frontend)
        kubectl logs -f deployment/geo-dashboard-dev-frontend -n geo-dashboard-dev
        ;;
    tiler)
        kubectl logs -f deployment/geo-dashboard-dev-tiler -n geo-dashboard-dev
        ;;
    db|database)
        kubectl logs -f statefulset/geo-dashboard-dev-postgresql -n geo-dashboard-dev
        ;;
    all|*)
        echo "📋 Available components: backend, frontend, tiler, database"
        echo "🔍 All pods in development namespace:"
        kubectl get pods -n geo-dashboard-dev
        ;;
esac
EOF

    chmod +x dev-logs.sh

    log "✓ Created development helper scripts"
}

setup_hosts_file() {
    log "Setting up hosts file for local development..."
    
    # Get cluster IP
    CLUSTER_IP=""
    if command -v kubectl &> /dev/null; then
        CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "")
    fi
    
    if [[ -z "$CLUSTER_IP" ]]; then
        CLUSTER_IP="127.0.0.1"
    fi
    
    # Check if entry already exists
    if grep -q "geo-dashboard.local" /etc/hosts 2>/dev/null; then
        warn "geo-dashboard.local already exists in /etc/hosts"
    else
        info "Adding geo-dashboard.local to /etc/hosts..."
        echo "Run this command to add the hosts entry:"
        echo "  sudo echo '$CLUSTER_IP geo-dashboard.local' >> /etc/hosts"
    fi
}

create_dockerfile_dev() {
    log "Creating development Dockerfiles..."
    
    # Backend development Dockerfile
    if [[ -n "$BACKEND_PATH" ]]; then
        cat > "$BACKEND_PATH/Dockerfile.dev" << 'EOF'
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install development dependencies
RUN pip install \
    watchdog \
    django-extensions \
    django-debug-toolbar \
    ipython

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=core.settings.development

# Expose port
EXPOSE 8000

# Default command (can be overridden)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
EOF
        log "✓ Created backend development Dockerfile"
    fi
    
    # Frontend development Dockerfile
    if [[ -n "$FRONTEND_PATH" ]]; then
        cat > "$FRONTEND_PATH/Dockerfile.dev" << 'EOF'
FROM node:16-alpine

# Set work directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install development dependencies
RUN npm install -g @craco/craco

# Set environment variables
ENV NODE_ENV=development
ENV FAST_REFRESH=true
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV GENERATE_SOURCEMAP=true

# Expose ports
EXPOSE 3000
EXPOSE 3001

# Default command (can be overridden)
CMD ["npm", "start"]
EOF
        log "✓ Created frontend development Dockerfile"
    fi
}

show_completion_info() {
    log "🎉 Hot reload setup completed!"
    echo ""
    echo -e "${GREEN}📁 Files Created:${NC}"
    echo -e "  📄 helm/geo-dashboard/values-dev-local.yaml  # Development configuration"
    echo -e "  🚀 start-dev.sh                             # Start development environment"
    echo -e "  🛑 stop-dev.sh                              # Stop development environment"
    echo -e "  📋 dev-logs.sh                              # View development logs"
    
    if [[ -n "$BACKEND_PATH" ]]; then
        echo -e "  🐍 $BACKEND_PATH/Dockerfile.dev            # Backend dev Dockerfile"
    fi
    
    if [[ -n "$FRONTEND_PATH" ]]; then
        echo -e "  ⚛️  $FRONTEND_PATH/Dockerfile.dev           # Frontend dev Dockerfile"
    fi
    
    echo ""
    echo -e "${BLUE}🚀 Quick Start:${NC}"
    echo -e "  ./start-dev.sh                               # Start with hot reload"
    echo -e "  ./dev-logs.sh backend                        # View backend logs"
    echo -e "  ./dev-logs.sh frontend                       # View frontend logs"
    echo -e "  ./stop-dev.sh                                # Stop development"
    echo ""
    echo -e "${YELLOW}🌐 Access:${NC}"
    echo -e "  Add to /etc/hosts: $CLUSTER_IP geo-dashboard.local"
    echo -e "  Then visit: http://geo-dashboard.local"
    echo ""
    echo -e "${GREEN}✨ Features Enabled:${NC}"
    echo -e "  🔥 Hot reload for backend (Django)"
    echo -e "  🔥 Hot reload for frontend (React)"
    echo -e "  🔍 Source maps and debugging"
    echo -e "  📊 Django debug toolbar"
    echo -e "  ⚡ Fast refresh for React"
    echo -e "  🔄 File watching with polling"
}

# Main execution
main() {
    show_banner
    
    detect_project_structure
    create_dev_values
    create_dev_scripts
    setup_hosts_file
    create_dockerfile_dev
    
    show_completion_info
}

# Run main function
main "$@" 