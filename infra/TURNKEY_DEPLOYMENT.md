# Geo Dashboard - Turnkey Kubernetes Deployment

This guide provides multiple ways to deploy the Geo Dashboard on any server with a complete Kubernetes setup.

## 🚀 Quick Start (Recommended)

### One-Line Installation
```bash
curl -sSL https://raw.githubusercontent.com/your-repo/geo-dashboard/main/infra/install.sh | bash
```

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/geo-dashboard.git
cd geo-dashboard/infra

# Make scripts executable
chmod +x install.sh start.sh

# Run the installer
./install.sh
```

## 📋 Prerequisites

### Minimum System Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB free space
- **OS**: Ubuntu 20.04+, CentOS 8+, or macOS

### Software Dependencies (Auto-installed)
- Docker
- kubectl
- Helm
- curl, wget, git, jq

## 🛠️ Installation Options

### 1. Complete Automated Setup
```bash
# Install everything (Kubernetes + Application)
./install.sh

# With custom options
./install.sh --cluster-type=k3s --domain=geo.example.com
```

### 2. Use Existing Kubernetes Cluster
```bash
# Skip cluster installation
./install.sh --skip-cluster
```

### 3. Choose Kubernetes Distribution
```bash
# Use k3s (lightweight, recommended)
./install.sh --cluster-type=k3s

# Use minikube (development)
./install.sh --cluster-type=minikube

# Use kubeadm (full cluster)
./install.sh --cluster-type=kubeadm
```

## 🎛️ Management Commands

### Using the Universal Start Script
```bash
# Interactive mode
./start.sh

# Direct commands
./start.sh helm prod start     # Deploy with Helm
./start.sh k8s dev start       # Deploy with raw manifests
./start.sh docker dev start    # Local development
```

### Using Helm Directly
```bash
# Install
helm install geo-dashboard ./helm/geo-dashboard \
  --namespace geo-dashboard \
  --create-namespace

# Upgrade
helm upgrade geo-dashboard ./helm/geo-dashboard \
  --namespace geo-dashboard

# Uninstall
helm uninstall geo-dashboard -n geo-dashboard
```

### Using kubectl
```bash
# Apply manifests
kubectl apply -k . -n geo-dashboard

# Check status
kubectl get pods -n geo-dashboard

# View logs
kubectl logs -f deployment/geo-dashboard-core -n geo-dashboard
```

## 🔧 Configuration Options

### Helm Values Customization
Create a custom `values.yaml`:

```yaml
# Custom domain
ingress:
  enabled: true
  hosts:
    - host: geo.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
          service: core

# Resource limits
core:
  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "2Gi"
      cpu: "1000m"

# Enable monitoring
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true

# Custom PostgreSQL settings
postgresql:
  primary:
    persistence:
      size: 20Gi
    resources:
      requests:
        memory: "2Gi"
        cpu: "1000m"
```

Deploy with custom values:
```bash
helm install geo-dashboard ./helm/geo-dashboard \
  --namespace geo-dashboard \
  --create-namespace \
  -f custom-values.yaml
```

### Environment Variables
Key environment variables you can customize:

```bash
# Core application
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*
DB_HOST=postgres-service
DB_PORT=5432

# Frontend
REACT_APP_API_URL=http://api.geo.example.com
REACT_APP_TILES_URL=http://tiles.geo.example.com
```

## 🌐 Network Configuration

### Ingress Setup
The deployment automatically configures ingress with these endpoints:

- `/` - Main web interface
- `/admin` - Django admin panel
- `/api/` - REST API endpoints
- `/tiles/` - Map tiles service

### Custom Domain Setup
1. Configure DNS to point to your cluster
2. Update ingress configuration:
```bash
# Using Helm
helm upgrade geo-dashboard ./helm/geo-dashboard \
  --set ingress.hosts[0].host=geo.yourdomain.com

# Using kubectl
kubectl patch ingress geo-dashboard -n geo-dashboard \
  --type='json' \
  -p='[{"op": "replace", "path": "/spec/rules/0/host", "value": "geo.yourdomain.com"}]'
```

### SSL/TLS Configuration
Enable HTTPS with cert-manager:

```yaml
# In values.yaml
ingress:
  tls:
    - secretName: geo-dashboard-tls
      hosts:
        - geo.yourdomain.com
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
```

## 📊 Monitoring and Observability

### Built-in Health Checks
- Application health endpoints
- Database connectivity checks
- Resource usage monitoring

### Prometheus Integration
Enable monitoring in Helm values:
```yaml
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    namespace: monitoring
```

### Log Aggregation
View logs from different components:
```bash
# Core application logs
kubectl logs -f deployment/geo-dashboard-core -n geo-dashboard

# Database logs
kubectl logs -f statefulset/geo-dashboard-postgresql -n geo-dashboard

# All pods
kubectl logs -f --selector=app.kubernetes.io/name=geo-dashboard -n geo-dashboard
```

## 🔒 Security Configuration

### Default Security Features
- Non-root containers
- Read-only root filesystems where possible
- Network policies (if supported)
- Secret management for credentials

### Custom Security Settings
```yaml
# In values.yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000
  capabilities:
    drop:
      - ALL

podSecurityContext:
  fsGroup: 2000
```

## 🔄 Backup and Recovery

### Database Backup
Enable automatic backups:
```yaml
# In values.yaml
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: "7d"
```

### Manual Backup
```bash
# Create backup
kubectl exec -it geo-dashboard-postgresql-0 -n geo-dashboard -- \
  pg_dump -U geouser geodashboard > backup.sql

# Restore backup
kubectl exec -i geo-dashboard-postgresql-0 -n geo-dashboard -- \
  psql -U geouser -d geodashboard < backup.sql
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Pods Not Starting
```bash
# Check pod status
kubectl get pods -n geo-dashboard

# Check events
kubectl get events -n geo-dashboard --sort-by=.metadata.creationTimestamp

# Check pod logs
kubectl describe pod <pod-name> -n geo-dashboard
```

#### 2. Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it geo-dashboard-core-xxx -n geo-dashboard -- \
  python manage.py dbshell

# Check database pod
kubectl logs geo-dashboard-postgresql-0 -n geo-dashboard
```

#### 3. Ingress Not Working
```bash
# Check ingress status
kubectl get ingress -n geo-dashboard

# Check ingress controller
kubectl get pods -n ingress-nginx  # or kube-system
```

### Debug Commands
```bash
# Get all resources
kubectl get all -n geo-dashboard

# Check resource usage
kubectl top pods -n geo-dashboard

# Port forward for local access
kubectl port-forward svc/geo-dashboard-core 8000:8000 -n geo-dashboard
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Using Helm
helm upgrade geo-dashboard ./helm/geo-dashboard \
  --namespace geo-dashboard

# Using kubectl
kubectl set image deployment/geo-dashboard-core \
  core=pronittardis/core-app:v2 -n geo-dashboard
```

### Scaling
```bash
# Scale core application
kubectl scale deployment geo-dashboard-core --replicas=3 -n geo-dashboard

# Using Helm
helm upgrade geo-dashboard ./helm/geo-dashboard \
  --set core.replicaCount=3 \
  --namespace geo-dashboard
```

### Auto-scaling
Enable horizontal pod autoscaling:
```yaml
# In values.yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## 🌍 Multi-Environment Setup

### Development Environment
```bash
./start.sh helm dev start
```

### Staging Environment
```bash
helm install geo-dashboard-staging ./helm/geo-dashboard \
  --namespace geo-dashboard-staging \
  --create-namespace \
  -f values-staging.yaml
```

### Production Environment
```bash
helm install geo-dashboard-prod ./helm/geo-dashboard \
  --namespace geo-dashboard-prod \
  --create-namespace \
  -f values-production.yaml
```

## 📞 Support

### Getting Help
- Check logs: `kubectl logs -f deployment/geo-dashboard-core -n geo-dashboard`
- Check status: `kubectl get pods -n geo-dashboard`
- View configuration: `helm get values geo-dashboard -n geo-dashboard`

### Community Resources
- GitHub Issues: [Report bugs and feature requests]
- Documentation: [Comprehensive guides and API docs]
- Discussions: [Community forum for questions]

## 🎯 What's Included

This turnkey deployment includes:

- ✅ **Complete Kubernetes cluster setup** (k3s, minikube, or kubeadm)
- ✅ **PostgreSQL database** with PostGIS extensions
- ✅ **Redis cache** for performance
- ✅ **Core Django application** with REST API
- ✅ **React frontend** with modern UI
- ✅ **Map tile server** for geospatial data
- ✅ **Ingress controller** for external access
- ✅ **SSL/TLS support** with cert-manager integration
- ✅ **Monitoring and logging** setup
- ✅ **Backup and recovery** tools
- ✅ **Auto-scaling** configuration
- ✅ **Security best practices** implemented

## 🚀 Next Steps

After successful deployment:

1. **Access the application** at the provided URL
2. **Configure your domain** for production use
3. **Set up SSL certificates** for HTTPS
4. **Configure monitoring** and alerting
5. **Set up automated backups**
6. **Scale resources** based on your needs

---

**Ready to deploy? Run `./install.sh` and you'll have a production-ready geo dashboard in minutes!** 