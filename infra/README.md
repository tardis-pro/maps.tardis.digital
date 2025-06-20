# Geo Dashboard - Simplified Infrastructure with Hot Reload

This is a turnkey Kubernetes deployment for the Geo Dashboard application with full development support including hot reload capabilities.

## Quick Start

### Prerequisites
- Kubernetes cluster (minikube, kind, or any K8s cluster)
- kubectl configured
- Docker (for development mode)
- NGINX Ingress Controller

### One-Command Deployment

```bash
# Make the script executable
chmod +x deploy.sh

# Production deployment
./deploy.sh start

# Development deployment with hot reload
./deploy.sh dev
```

## Commands

### Production Mode
```bash
# Deploy production stack
./deploy.sh start

# Stop everything
./deploy.sh stop

# Restart production
./deploy.sh restart

# Check status
./deploy.sh status
```

### Development Mode (Hot Reload)
```bash
# Deploy development stack with hot reload
./deploy.sh dev

# Restart development environment
./deploy.sh restart-dev

# Setup host file entries
./deploy.sh hosts
```

## What Gets Deployed

### Production Mode
1. **PostgreSQL Database** with PostGIS extensions
2. **Core Django Application** (production image)
3. **Martin Vector Tiler** for map tiles
4. **Production Ingress** for routing
5. **Persistent Storage** for data

### Development Mode
1. **PostgreSQL Database** with PostGIS extensions
2. **Core Django Application** with hot reload (development server)
3. **React Frontend** with hot reload (development server)
4. **Martin Vector Tiler** for map tiles
5. **Development Ingress** with extended timeouts
6. **Source Code Mounting** from host filesystem

## Hot Reload Features

### Backend (Django)
- ✅ **Auto-reload**: Django development server automatically restarts on code changes
- ✅ **Source mounting**: Backend code mounted from `backend/core-monolith/dashboard/`
- ✅ **Debug mode**: Full Django debug mode with detailed error pages
- ✅ **Database migrations**: Automatic migration on startup
- ✅ **Admin user**: Auto-created superuser (admin/admin123)

### Frontend (React)
- ✅ **Live reload**: React development server with instant refresh
- ✅ **Source mounting**: Frontend code mounted from `frontend/`
- ✅ **Hot module replacement**: Components update without full page reload
- ✅ **File watching**: Polling-based file watching for container compatibility

## Access Points

### Production Mode
- API: `http://localhost/api/`
- Tiles: `http://localhost/tiles/`
- Custom domain: `http://geo-dashboard.local/`

### Development Mode
- **Frontend**: `http://localhost/` or `http://dev.geo-dashboard.local/`
- **API**: `http://localhost/api/`
- **Admin Panel**: `http://localhost/api/admin/` (admin/admin123)
- **Tiles**: `http://localhost/tiles/`

## Architecture

```
Development Mode:
Internet → Ingress → Frontend (React Dev Server) → API (Django Dev Server) → Database
                  ↓                              ↓
            Host Filesystem                Host Filesystem
            (Hot Reload)                   (Hot Reload)

Production Mode:
Internet → Ingress → API (Django Production) → Database
                  ↓
            Persistent Storage
```

## Development Workflow

### Making Changes

1. **Backend Changes**: Edit files in `backend/core-monolith/dashboard/`
   - Django development server automatically reloads
   - View logs: `kubectl logs -f deployment/core-app-dev -n geo-dashboard`

2. **Frontend Changes**: Edit files in `frontend/src/`
   - React development server automatically reloads
   - View logs: `kubectl logs -f deployment/frontend-dev -n geo-dashboard`

### Database Access
```bash
# Access database directly
kubectl exec -it postgres-0 -n geo-dashboard -- psql -U geouser -d geodashboard

# Run Django management commands
kubectl exec -it deployment/core-app-dev -n geo-dashboard -- python manage.py shell
kubectl exec -it deployment/core-app-dev -n geo-dashboard -- python manage.py migrate
kubectl exec -it deployment/core-app-dev -n geo-dashboard -- python manage.py createsuperuser
```

### Port Forwarding (Alternative Access)
```bash
# Direct access to services
kubectl port-forward service/core-service-dev 8000:8000 -n geo-dashboard
kubectl port-forward service/frontend-service-dev 3000:3000 -n geo-dashboard
kubectl port-forward service/postgres-service 5432:5432 -n geo-dashboard
```

## Troubleshooting

### Common Issues

1. **Hot reload not working**:
   ```bash
   # Check if source code is properly mounted
   kubectl exec -it deployment/core-app-dev -n geo-dashboard -- ls -la /app
   kubectl exec -it deployment/frontend-dev -n geo-dashboard -- ls -la /app
   ```

2. **Database connection issues**:
   ```bash
   # Check database status
   kubectl get pods -l app=postgres -n geo-dashboard
   kubectl logs statefulset/postgres -n geo-dashboard
   ```

3. **Frontend not loading**:
   ```bash
   # Check frontend logs
   kubectl logs -f deployment/frontend-dev -n geo-dashboard
   
   # Check if node_modules is installed
   kubectl exec -it deployment/frontend-dev -n geo-dashboard -- ls -la /app/node_modules
   ```

### Viewing Logs
```bash
# All logs at once
kubectl logs -f deployment/core-app-dev -n geo-dashboard &
kubectl logs -f deployment/frontend-dev -n geo-dashboard &
kubectl logs -f deployment/vector-tiler -n geo-dashboard &

# Individual service logs
kubectl logs -f deployment/core-app-dev -n geo-dashboard
kubectl logs -f deployment/frontend-dev -n geo-dashboard
kubectl logs -f statefulset/postgres -n geo-dashboard
```

### Resource Monitoring
```bash
# Check resource usage
kubectl top pods -n geo-dashboard
kubectl describe pod <pod-name> -n geo-dashboard

# Check persistent volumes
kubectl get pv,pvc -n geo-dashboard
```

## Configuration

### Environment Variables (Development)
- `DJANGO_DEBUG=True`
- `DJANGO_SETTINGS_MODULE=dashboard.settings`
- `CHOKIDAR_USEPOLLING=true` (Frontend file watching)
- `REACT_APP_API_URL=http://localhost:8000`

### Default Credentials
- **Database**: `geouser` / `geopassword123`
- **Database Name**: `geodashboard`
- **Admin User**: `admin` / `admin123`

### File Paths
- **Backend Source**: `backend/core-monolith/dashboard/` → `/app` (container)
- **Frontend Source**: `frontend/` → `/app` (container)
- **Requirements**: `backend/core-monolith/requirements.txt`

## Scaling

### Production Scaling
```bash
# Scale core application
kubectl scale deployment core-app --replicas=5 -n geo-dashboard

# Scale vector tiler
kubectl scale deployment vector-tiler --replicas=5 -n geo-dashboard
```

### Development Scaling
Development mode runs single replicas for consistency with file watching.

## Host File Setup

Add these entries to your `/etc/hosts` file:
```
127.0.0.1 geo-dashboard.local dev.geo-dashboard.local
```

Or run:
```bash
./deploy.sh hosts
```

## Cleanup

```bash
# Complete cleanup (removes all data)
./deploy.sh stop
```

## Performance Tips

### Development Mode
- Use SSD storage for better file watching performance
- Increase resource limits if experiencing slow reloads
- Consider using local development for intensive development work

### Production Mode
- Monitor resource usage and scale accordingly
- Use persistent volumes for data persistence
- Configure proper resource limits and requests

## Security Notes

### Development Mode
- **Not for production**: Debug mode enabled, weak secrets
- **Local access only**: Designed for local development
- **File system access**: Source code mounted from host

### Production Mode
- Strong secrets generated automatically
- Production Django settings
- Proper health checks and resource limits

This setup provides a complete development experience with hot reload capabilities while maintaining production deployment options. 