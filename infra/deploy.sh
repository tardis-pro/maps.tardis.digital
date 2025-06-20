#!/bin/bash

# Geo Dashboard - Turnkey Kubernetes Deployment Script with Hot Reload
# Usage: ./deploy.sh [start|stop|restart|status|dev]

set -e

NAMESPACE="geo-dashboard"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed. Please install kubectl first."
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please ensure your cluster is running and kubectl is configured."
    fi
    
    # Check if docker is available for dev mode
    if [[ "${1:-}" == "dev" ]] && ! command -v docker &> /dev/null; then
        error "Docker is not installed. Required for development mode."
    fi
    
    log "Prerequisites check passed ✓"
}

# Create namespace
create_namespace() {
    log "Creating namespace: $NAMESPACE"
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
}

# Create secrets
create_secrets() {
    log "Creating secrets..."
    
    # PostgreSQL secrets
    kubectl create secret generic postgres-secrets \
        --from-literal=POSTGRES_USER=geouser \
        --from-literal=POSTGRES_PASSWORD=geopassword123 \
        --from-literal=POSTGRES_DBNAME=geodashboard \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Core app secrets
    kubectl create secret generic core-secrets \
        --from-literal=DJANGO_SECRET_KEY="dev-secret-key-$(openssl rand -hex 16)" \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Database access secrets
    kubectl create secret generic dba-secrets \
        --from-literal=DB_DATABASE=geodashboard \
        --from-literal=POSTGRESQL_USER=geouser \
        --from-literal=POSTGRESQL_PASS=geopassword123 \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
}

# Deploy database
deploy_database() {
    log "Deploying PostgreSQL database..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: geo-storage
provisioner: k8s.io/minikube-hostpath
allowVolumeExpansion: true
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: $NAMESPACE
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: geo-storage
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: $NAMESPACE
  labels:
    app: postgres
spec:
  serviceName: "postgres-service"
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: kartoza/postgis:14-3.2
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: POSTGRES_PASSWORD
        - name: POSTGRES_DBNAME
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: POSTGRES_DBNAME
        - name: POSTGRES_MULTIPLE_EXTENSIONS
          value: postgis,hstore,postgis_topology,postgis_raster,pgrouting
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        readinessProbe:
          exec:
            command:
              - /bin/sh
              - -c
              - pg_isready -U \$POSTGRES_USER -d \$POSTGRES_DBNAME
          initialDelaySeconds: 15
          periodSeconds: 5
        livenessProbe:
          exec:
            command:
              - /bin/sh
              - -c
              - pg_isready -U \$POSTGRES_USER -d \$POSTGRES_DBNAME
          initialDelaySeconds: 45
          periodSeconds: 10
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: $NAMESPACE
spec:
  selector:
    app: postgres
  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432
  type: ClusterIP
EOF
}

# Deploy core application (production mode)
deploy_core() {
    log "Deploying core application..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-app
  namespace: $NAMESPACE
spec:
  replicas: 2
  selector:
    matchLabels:
      app: core-app
  template:
    metadata:
      labels:
        app: core-app
    spec:
      initContainers:
      - name: wait-for-db
        image: busybox:1.35
        command: ['sh', '-c']
        args:
          - |
            until nc -z postgres-service 5432; do
              echo "Waiting for PostgreSQL..."
              sleep 2
            done
            echo "PostgreSQL is ready!"
      containers:
      - name: core-app
        image: pronittardis/core-app:v1
        ports:
        - containerPort: 8000
        env:
        - name: DJANGO_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: core-secrets
              key: DJANGO_SECRET_KEY
        - name: DJANGO_DEBUG
          value: "False"
        - name: DB_DATABASE
          valueFrom:
            secretKeyRef:
              name: dba-secrets
              key: DB_DATABASE
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: dba-secrets
              key: POSTGRESQL_USER
        - name: DB_PORT
          value: "5432"
        - name: DB_HOST
          value: "postgres-service"
        - name: POSTGRESQL_PASS
          valueFrom:
            secretKeyRef:
              name: dba-secrets
              key: POSTGRESQL_PASS
        readinessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: core-service
  namespace: $NAMESPACE
spec:
  selector:
    app: core-app
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
  type: ClusterIP
EOF
}

# Deploy core application (development mode with hot reload)
deploy_core_dev() {
    log "Deploying core application in development mode with hot reload..."
    
    # Create ConfigMap for development settings
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: dev-scripts
  namespace: $NAMESPACE
data:
  start-dev.sh: |
    #!/bin/bash
    echo "Starting Django development server with hot reload..."
    cd /app
    
    # Install development dependencies
    pip install watchdog
    
    # Run migrations
    python manage.py migrate --noinput
    
    # Create superuser if it doesn't exist
    python manage.py shell -c "
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print('Superuser created: admin/admin123')
    "
    
    # Start development server with auto-reload
    python manage.py runserver 0.0.0.0:8000 --settings=dashboard.settings
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-app-dev
  namespace: $NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: core-app-dev
  template:
    metadata:
      labels:
        app: core-app-dev
    spec:
      initContainers:
      - name: wait-for-db
        image: busybox:1.35
        command: ['sh', '-c']
        args:
          - |
            until nc -z postgres-service 5432; do
              echo "Waiting for PostgreSQL..."
              sleep 2
            done
            echo "PostgreSQL is ready!"
      containers:
      - name: core-app-dev
        image: python:3.11-slim
        ports:
        - containerPort: 8000
        command: ["/bin/bash", "/scripts/start-dev.sh"]
        env:
        - name: DJANGO_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: core-secrets
              key: DJANGO_SECRET_KEY
        - name: DJANGO_DEBUG
          value: "True"
        - name: DJANGO_SETTINGS_MODULE
          value: "dashboard.settings"
        - name: DB_DATABASE
          valueFrom:
            secretKeyRef:
              name: dba-secrets
              key: DB_DATABASE
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: dba-secrets
              key: POSTGRESQL_USER
        - name: DB_PORT
          value: "5432"
        - name: DB_HOST
          value: "postgres-service"
        - name: POSTGRESQL_PASS
          valueFrom:
            secretKeyRef:
              name: dba-secrets
              key: POSTGRESQL_PASS
        - name: PYTHONUNBUFFERED
          value: "1"
        volumeMounts:
        - name: source-code
          mountPath: /app
        - name: dev-scripts
          mountPath: /scripts
        - name: requirements
          mountPath: /requirements
        workingDir: /app
        readinessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 120
          periodSeconds: 15
      volumes:
      - name: source-code
        hostPath:
          path: $PROJECT_ROOT/backend/core-monolith/dashboard
          type: Directory
      - name: dev-scripts
        configMap:
          name: dev-scripts
          defaultMode: 0755
      - name: requirements
        hostPath:
          path: $PROJECT_ROOT/backend/core-monolith
          type: Directory
      initContainers:
      - name: install-deps
        image: python:3.11-slim
        command: ["/bin/bash", "-c"]
        args:
          - |
            apt-get update && apt-get install -y gcc libpq-dev
            pip install -r /requirements/requirements.txt
            pip install psycopg2-binary
        volumeMounts:
        - name: requirements
          mountPath: /requirements
---
apiVersion: v1
kind: Service
metadata:
  name: core-service-dev
  namespace: $NAMESPACE
spec:
  selector:
    app: core-app-dev
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
  type: ClusterIP
EOF
}

# Deploy tiler services
deploy_tiler() {
    log "Deploying tiler services..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: tiles-pvc
  namespace: $NAMESPACE
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: geo-storage
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: martin-config
  namespace: $NAMESPACE
data:
  config.yaml: |
    listen_addresses: "0.0.0.0:3000"
    pool_size: 20
    keep_alive: 75
    worker_processes: 4
    postgres:
      connection_string: "postgresql://geouser:geopassword123@postgres-service:5432/geodashboard"
      auto_publish:
        tables: true
        functions: true
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vector-tiler
  namespace: $NAMESPACE
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vector-tiler
  template:
    metadata:
      labels:
        app: vector-tiler
    spec:
      initContainers:
      - name: wait-for-db
        image: busybox:1.35
        command: ['sh', '-c']
        args:
          - |
            until nc -z postgres-service 5432; do
              echo "Waiting for PostgreSQL..."
              sleep 2
            done
            echo "PostgreSQL is ready!"
      containers:
      - name: vector-tiler
        image: ghcr.io/maplibre/martin:latest
        ports:
        - containerPort: 3000
        args:
          - "--config"
          - "/config/config.yaml"
        volumeMounts:
        - name: tile-storage
          mountPath: /tiles
        - name: config
          mountPath: /config
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 10
      volumes:
      - name: tile-storage
        persistentVolumeClaim:
          claimName: tiles-pvc
      - name: config
        configMap:
          name: martin-config
---
apiVersion: v1
kind: Service
metadata:
  name: vector-tiler-service
  namespace: $NAMESPACE
spec:
  selector:
    app: vector-tiler
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
  type: ClusterIP
EOF
}

# Deploy frontend development server
deploy_frontend_dev() {
    log "Deploying frontend development server with hot reload..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-dev-scripts
  namespace: $NAMESPACE
data:
  start-frontend.sh: |
    #!/bin/bash
    echo "Starting React development server with hot reload..."
    cd /app
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    
    # Start development server
    export CHOKIDAR_USEPOLLING=true
    export WATCHPACK_POLLING=true
    npm start
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-dev
  namespace: $NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend-dev
  template:
    metadata:
      labels:
        app: frontend-dev
    spec:
      containers:
      - name: frontend-dev
        image: node:18-alpine
        ports:
        - containerPort: 3000
        command: ["/bin/sh", "/scripts/start-frontend.sh"]
        env:
        - name: CHOKIDAR_USEPOLLING
          value: "true"
        - name: WATCHPACK_POLLING
          value: "true"
        - name: REACT_APP_API_URL
          value: "http://localhost:8000"
        - name: REACT_APP_TILES_URL
          value: "http://localhost:3001"
        volumeMounts:
        - name: source-code
          mountPath: /app
        - name: dev-scripts
          mountPath: /scripts
        - name: node-modules
          mountPath: /app/node_modules
        workingDir: /app
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 120
          periodSeconds: 15
      volumes:
      - name: source-code
        hostPath:
          path: $PROJECT_ROOT/frontend
          type: Directory
      - name: dev-scripts
        configMap:
          name: frontend-dev-scripts
          defaultMode: 0755
      - name: node-modules
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service-dev
  namespace: $NAMESPACE
spec:
  selector:
    app: frontend-dev
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
  type: ClusterIP
EOF
}

# Deploy ingress (production)
deploy_ingress() {
    log "Deploying production ingress..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: geo-dashboard-ingress
  namespace: $NAMESPACE
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /\$2
spec:
  rules:
  - host: geo-dashboard.local
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: core-service
            port:
              number: 8000
      - path: /tiles(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: vector-tiler-service
            port:
              number: 3000
  - host: localhost
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: core-service
            port:
              number: 8000
      - path: /tiles(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: vector-tiler-service
            port:
              number: 3000
EOF
}

# Deploy ingress (development)
deploy_ingress_dev() {
    log "Deploying development ingress with hot reload support..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: geo-dashboard-ingress-dev
  namespace: $NAMESPACE
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /\$2
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  rules:
  - host: dev.geo-dashboard.local
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: core-service-dev
            port:
              number: 8000
      - path: /tiles(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: vector-tiler-service
            port:
              number: 3000
      - path: /(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: frontend-service-dev
            port:
              number: 3000
  - host: localhost
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: core-service-dev
            port:
              number: 8000
      - path: /tiles(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: vector-tiler-service
            port:
              number: 3000
EOF
}

# Wait for deployments to be ready
wait_for_deployments() {
    local mode=${1:-prod}
    log "Waiting for deployments to be ready..."
    
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
    
    if [[ "$mode" == "dev" ]]; then
        kubectl wait --for=condition=ready pod -l app=core-app-dev -n $NAMESPACE --timeout=300s
        kubectl wait --for=condition=ready pod -l app=frontend-dev -n $NAMESPACE --timeout=300s
    else
        kubectl wait --for=condition=ready pod -l app=core-app -n $NAMESPACE --timeout=300s
    fi
    
    kubectl wait --for=condition=ready pod -l app=vector-tiler -n $NAMESPACE --timeout=300s
    
    log "All deployments are ready ✓"
}

# Start function (production)
start() {
    log "Starting Geo Dashboard deployment (Production Mode)..."
    
    check_prerequisites
    create_namespace
    create_secrets
    deploy_database
    deploy_core
    deploy_tiler
    deploy_ingress
    wait_for_deployments prod
    
    log "Production deployment completed successfully! ✓"
    show_status
}

# Start function (development with hot reload)
start_dev() {
    log "Starting Geo Dashboard deployment (Development Mode with Hot Reload)..."
    
    check_prerequisites dev
    create_namespace
    create_secrets
    deploy_database
    deploy_core_dev
    deploy_frontend_dev
    deploy_tiler
    deploy_ingress_dev
    wait_for_deployments dev
    
    log "Development deployment completed successfully! ✓"
    log "Hot reload is enabled for both frontend and backend"
    show_status_dev
}

# Stop function
stop() {
    log "Stopping Geo Dashboard..."
    
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        kubectl delete namespace $NAMESPACE
        log "Geo Dashboard stopped and cleaned up ✓"
    else
        warn "Namespace $NAMESPACE not found. Nothing to stop."
    fi
}

# Restart function
restart() {
    log "Restarting Geo Dashboard..."
    stop
    sleep 5
    start
}

# Restart dev function
restart_dev() {
    log "Restarting Geo Dashboard (Development Mode)..."
    stop
    sleep 5
    start_dev
}

# Status function (production)
show_status() {
    log "Geo Dashboard Status (Production):"
    echo ""
    
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        warn "Geo Dashboard is not deployed (namespace not found)"
        return
    fi
    
    info "Namespace: $NAMESPACE"
    echo ""
    
    info "Pods:"
    kubectl get pods -n $NAMESPACE -o wide
    echo ""
    
    info "Services:"
    kubectl get services -n $NAMESPACE
    echo ""
    
    info "Ingress:"
    kubectl get ingress -n $NAMESPACE
    echo ""
    
    info "Storage:"
    kubectl get pvc -n $NAMESPACE
    echo ""
    
    # Show access URLs
    info "Access URLs:"
    echo "  - API: http://localhost/api/"
    echo "  - Tiles: http://localhost/tiles/"
    echo "  - Custom domain: Add 'geo-dashboard.local' to your /etc/hosts"
    echo ""
    
    # Show logs command
    info "To view logs:"
    echo "  kubectl logs -f deployment/core-app -n $NAMESPACE"
    echo "  kubectl logs -f deployment/vector-tiler -n $NAMESPACE"
    echo "  kubectl logs -f statefulset/postgres -n $NAMESPACE"
}

# Status function (development)
show_status_dev() {
    log "Geo Dashboard Status (Development with Hot Reload):"
    echo ""
    
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        warn "Geo Dashboard is not deployed (namespace not found)"
        return
    fi
    
    info "Namespace: $NAMESPACE"
    echo ""
    
    info "Pods:"
    kubectl get pods -n $NAMESPACE -o wide
    echo ""
    
    info "Services:"
    kubectl get services -n $NAMESPACE
    echo ""
    
    info "Ingress:"
    kubectl get ingress -n $NAMESPACE
    echo ""
    
    # Show access URLs
    info "Development Access URLs:"
    echo "  - Frontend (Hot Reload): http://localhost/ or http://dev.geo-dashboard.local/"
    echo "  - API (Hot Reload): http://localhost/api/"
    echo "  - Tiles: http://localhost/tiles/"
    echo "  - Admin Panel: http://localhost/api/admin/ (admin/admin123)"
    echo ""
    
    info "Hot Reload Features:"
    echo "  ✓ Frontend: React development server with live reload"
    echo "  ✓ Backend: Django development server with auto-reload"
    echo "  ✓ Source code mounted from host filesystem"
    echo ""
    
    info "Development Commands:"
    echo "  # Access backend shell"
    echo "  kubectl exec -it deployment/core-app-dev -n $NAMESPACE -- python manage.py shell"
    echo ""
    echo "  # View live logs"
    echo "  kubectl logs -f deployment/core-app-dev -n $NAMESPACE"
    echo "  kubectl logs -f deployment/frontend-dev -n $NAMESPACE"
    echo ""
    echo "  # Port forward for direct access"
    echo "  kubectl port-forward service/core-service-dev 8000:8000 -n $NAMESPACE"
    echo "  kubectl port-forward service/frontend-service-dev 3000:3000 -n $NAMESPACE"
}

# Setup host entries
setup_hosts() {
    log "Setting up host entries..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
        if ! grep -q "geo-dashboard.local" /etc/hosts; then
            echo "127.0.0.1 geo-dashboard.local dev.geo-dashboard.local" | sudo tee -a /etc/hosts
            log "Added host entries to /etc/hosts"
        else
            log "Host entries already exist"
        fi
    else
        warn "Please add the following to your hosts file:"
        echo "127.0.0.1 geo-dashboard.local dev.geo-dashboard.local"
    fi
}

# Main script logic
case "${1:-start}" in
    start)
        start
        ;;
    dev)
        start_dev
        setup_hosts
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    restart-dev)
        restart_dev
        setup_hosts
        ;;
    status)
        if kubectl get deployment core-app-dev -n $NAMESPACE &> /dev/null; then
            show_status_dev
        else
            show_status
        fi
        ;;
    hosts)
        setup_hosts
        ;;
    *)
        echo "Usage: $0 {start|dev|stop|restart|restart-dev|status|hosts}"
        echo ""
        echo "Commands:"
        echo "  start       - Deploy production stack"
        echo "  dev         - Deploy development stack with hot reload"
        echo "  stop        - Stop and clean up all resources"
        echo "  restart     - Restart production deployment"
        echo "  restart-dev - Restart development deployment"
        echo "  status      - Show current deployment status"
        echo "  hosts       - Setup host file entries"
        echo ""
        echo "Development Features:"
        echo "  • Hot reload for React frontend"
        echo "  • Auto-reload for Django backend"
        echo "  • Source code mounted from filesystem"
        echo "  • Development database with sample data"
        echo "  • Debug mode enabled"
        exit 1
        ;;
esac 