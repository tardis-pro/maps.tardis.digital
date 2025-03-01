# Maps Platform Infrastructure

This repository contains the Kubernetes infrastructure configuration for the Maps Platform.

## Prerequisites

- Kubernetes 1.20+ cluster
- kubectl 1.20+
- Helm 3.0+
- Ingress NGINX Controller
- cert-manager (for TLS)

## Quick Start

```bash
# 1. Create namespace
kubectl apply -f base/namespace.yaml

# 2. Create required secrets
kubectl create secret generic postgres-secrets \
  --namespace=maps \
  --from-literal=POSTGRES_USER=youruser \
  --from-literal=POSTGRES_PASSWORD=yourpassword \
  --from-literal=POSTGRES_DBNAME=maps

kubectl create secret generic core-secrets \
  --namespace=maps \
  --from-literal=DJANGO_SECRET_KEY=yoursecretkey

# 3. Apply storage resources
kubectl apply -f base/storage-class.yaml
kubectl apply -f storage/postgres-pvc.yaml
kubectl apply -f storage/tile-pvc.yaml

# 4. Deploy the database
kubectl apply -f database/

# 5. Run database migrations
kubectl apply -f database/migration-job.yaml

# 6. Deploy core application
kubectl apply -f core/

# 7. Deploy tiler services
kubectl apply -f tiler/

# 8. Deploy authentication (if needed)
kubectl apply -f authentication/

# 9. Verify all services are running
kubectl get all -n maps
```

## Component Architecture

### Database Layer
- PostgreSQL with PostGIS extensions for geospatial data
- Persistent storage with StatefulSet for reliability

### Core Application
- Django-based API server
- Handles authentication, data management, and API endpoints

### Tiler Services
- Vector Tiler: Serves vector tiles using Martin
- Raster Tiler: Serves raster tiles using TiTiler

## Performance Tuning

### Database Performance
- Memory settings optimized for geospatial queries
- Persistent volume for data durability

### Tiler Performance
- Multiple replicas for parallel processing
- Resource limits set for predictable performance
- Read-only volume mounts for better I/O performance

### Core API Performance
- Multiple replicas with auto-scaling
- Properly configured resource limits
- Health checks for reliability

## Monitoring and Maintenance

### Health Checks
All services include readiness and liveness probes for better reliability.

### Scaling Recommendations
- Vector Tiler: Scale horizontally for more concurrent connections
- Database: Consider using a managed service for production environments
- Core API: Scale based on CPU usage metrics

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   kubectl logs deployment/core-app -n maps
   kubectl get pods -n maps -l app=postgres
   kubectl describe pod -n maps -l app=postgres
   ```

2. **Tiler Service Problems**
   ```bash
   kubectl logs deployment/vector-tiler -n maps
   kubectl describe service vector-tiler-service -n maps
   ```

3. **Storage Issues**
   ```bash
   kubectl get pv,pvc -n maps
   kubectl describe pvc postgres-pvc -n maps
   ```