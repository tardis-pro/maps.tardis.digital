# 🔥 Hot Reload Development Guide

This guide explains how to set up and use hot reloading for real-time development with the Geo Dashboard in Kubernetes.

## 🚀 Quick Start

### One-Command Setup
```bash
cd infra
./setup-hot-reload.sh
./start-dev.sh
```

### Using the Universal Script
```bash
# Interactive mode
./start.sh
# Choose: helm -> dev -> start

# Direct command
./start.sh helm dev start
```

## 🎯 What is Hot Reload?

Hot reload enables real-time code changes without manual restarts:

- **Backend (Django)**: Automatic server restart when Python files change
- **Frontend (React)**: Instant browser updates when JavaScript/CSS files change
- **Live Debugging**: Source maps, debug toolbar, and dev tools enabled
- **File Watching**: Monitors your local source code for changes

## 🛠️ Setup Process

### 1. Automatic Setup
The setup script automatically:
- Detects your project structure
- Configures volume mounts for your source code
- Creates development-specific Helm values
- Sets up helper scripts for easy management
- Configures WebSocket support for hot reload

### 2. Manual Configuration
If you need to customize paths:

```bash
# Edit the generated values file
vim helm/geo-dashboard/values-dev-local.yaml

# Update the hostPath values:
development:
  volumeMounts:
    backend:
      hostPath: "/path/to/your/backend"
    frontend:
      hostPath: "/path/to/your/frontend"
```

## 🔧 Development Environment Features

### Backend Hot Reload (Django)
- **Watchdog**: File system monitoring for Python changes
- **Django Extensions**: Enhanced development server with `runserver_plus`
- **Debug Toolbar**: SQL queries, cache hits, and performance metrics
- **Auto-reload**: Automatic server restart on code changes
- **Enhanced Logging**: Verbose output for debugging

### Frontend Hot Reload (React)
- **Fast Refresh**: Preserve component state during updates
- **WebSocket**: Real-time communication for instant updates
- **Source Maps**: Debug original source code in browser
- **Polling**: File watching that works across different file systems
- **HMR**: Hot Module Replacement for CSS and JavaScript

### Development Tools
- **Enhanced Error Pages**: Detailed error information
- **Live Reloading**: Browser automatically refreshes on changes
- **Debug Console**: Interactive Python and JavaScript consoles
- **Performance Monitoring**: Real-time metrics and profiling

## 📁 File Structure

After setup, you'll have these files:

```
infra/
├── helm/geo-dashboard/
│   ├── values-dev-local.yaml      # Your custom dev configuration
│   └── values-dev.yaml            # Template dev configuration
├── setup-hot-reload.sh            # Setup script
├── start-dev.sh                   # Start development environment
├── stop-dev.sh                    # Stop development environment
└── dev-logs.sh                    # View development logs
```

## 🎮 Development Commands

### Starting Development
```bash
# Start with hot reload
./start-dev.sh

# Or using the universal script
./start.sh helm dev start
```

### Monitoring
```bash
# View all pods
kubectl get pods -n geo-dashboard-dev

# View backend logs (with hot reload messages)
./dev-logs.sh backend

# View frontend logs (with hot reload messages)
./dev-logs.sh frontend

# View all logs
kubectl logs -f --selector=app.kubernetes.io/name=geo-dashboard -n geo-dashboard-dev
```

### Stopping Development
```bash
# Stop development environment
./stop-dev.sh

# Or using the universal script
./start.sh helm dev stop
```

## 🌐 Accessing Your Application

### Local Access
1. Add to your `/etc/hosts` file:
   ```bash
   sudo echo "$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}') geo-dashboard.local" >> /etc/hosts
   ```

2. Access the application:
   - **Main App**: http://geo-dashboard.local
   - **Admin Panel**: http://geo-dashboard.local/admin
   - **API**: http://geo-dashboard.local/api
   - **Tiles**: http://geo-dashboard.local/tiles

### Port Forwarding (Alternative)
```bash
# Forward frontend port
kubectl port-forward svc/geo-dashboard-dev-frontend 3000:3000 -n geo-dashboard-dev

# Forward backend port
kubectl port-forward svc/geo-dashboard-dev-core 8000:8000 -n geo-dashboard-dev

# Access via localhost
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## 🔄 Hot Reload in Action

### Backend Changes
1. Edit a Python file in your backend directory
2. Save the file
3. Watch the backend logs: `./dev-logs.sh backend`
4. See the Django server automatically restart
5. Refresh your browser to see changes

### Frontend Changes
1. Edit a React component in your frontend directory
2. Save the file
3. Watch the browser automatically update
4. Component state is preserved (Fast Refresh)
5. CSS changes apply instantly

### Example Workflow
```bash
# Terminal 1: Start development
./start-dev.sh

# Terminal 2: Watch backend logs
./dev-logs.sh backend

# Terminal 3: Watch frontend logs
./dev-logs.sh frontend

# Edit your code in your favorite editor
# Changes appear automatically!
```

## ⚙️ Configuration Options

### Environment Variables

#### Backend (Django)
```yaml
env:
  DJANGO_DEBUG: "True"
  DJANGO_SETTINGS_MODULE: "core.settings.development"
  PYTHONUNBUFFERED: "1"
  WATCHDOG_ENABLED: "1"
  HOT_RELOAD: "1"
```

#### Frontend (React)
```yaml
env:
  NODE_ENV: "development"
  FAST_REFRESH: "true"
  CHOKIDAR_USEPOLLING: "true"
  WATCHPACK_POLLING: "true"
  GENERATE_SOURCEMAP: "true"
```

### File Watching Configuration
```yaml
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
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Changes Not Detected
```bash
# Check if volumes are mounted correctly
kubectl describe pod <pod-name> -n geo-dashboard-dev

# Verify file permissions
ls -la /path/to/your/source/code

# Check polling is enabled
./dev-logs.sh frontend | grep -i polling
```

#### 2. WebSocket Connection Issues
```bash
# Check ingress configuration
kubectl get ingress -n geo-dashboard-dev

# Verify WebSocket headers
curl -H "Upgrade: websocket" -H "Connection: upgrade" http://geo-dashboard.local/ws
```

#### 3. Hot Reload Not Working
```bash
# Restart the development environment
./stop-dev.sh
./start-dev.sh

# Check for errors in logs
./dev-logs.sh backend
./dev-logs.sh frontend
```

#### 4. Performance Issues
```bash
# Reduce polling interval
# Edit values-dev-local.yaml:
hotReloadConfig:
  pollInterval: 2  # Increase from 1 to 2 seconds

# Limit watched paths
watchPaths:
  - "/app/src"  # Only watch specific directories
```

### Debug Commands
```bash
# Check pod status
kubectl get pods -n geo-dashboard-dev

# Describe problematic pod
kubectl describe pod <pod-name> -n geo-dashboard-dev

# Check events
kubectl get events -n geo-dashboard-dev --sort-by=.metadata.creationTimestamp

# View detailed logs
kubectl logs <pod-name> -n geo-dashboard-dev --previous

# Check volume mounts
kubectl exec -it <pod-name> -n geo-dashboard-dev -- ls -la /app
```

## 🎯 Best Practices

### 1. Code Organization
- Keep source code in clearly defined directories
- Use consistent file naming conventions
- Organize components logically

### 2. Development Workflow
- Use version control effectively
- Test changes in small increments
- Monitor logs for errors and warnings

### 3. Performance Optimization
- Limit watched directories to essential paths
- Use appropriate polling intervals
- Close unnecessary browser tabs

### 4. Security Considerations
- Only use hot reload in development
- Don't expose development ports publicly
- Use development-specific secrets

## 🚀 Advanced Usage

### Custom Development Images
Build custom development images with additional tools:

```dockerfile
# Backend Dockerfile.dev
FROM python:3.9-slim

# Install development tools
RUN pip install \
    watchdog \
    django-extensions \
    django-debug-toolbar \
    ipython \
    jupyter

# Add your custom development setup
```

### Multiple Environments
Set up different development environments:

```bash
# Create staging development
helm install geo-dashboard-staging ./helm/geo-dashboard \
  --namespace geo-dashboard-staging \
  --values values-dev-local.yaml \
  --set ingress.hosts[0].host=geo-staging.local
```

### IDE Integration
Configure your IDE for better development experience:

#### VS Code
```json
{
  "python.defaultInterpreterPath": "/app/venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "files.watcherExclude": {
    "**/node_modules/**": true
  }
}
```

#### PyCharm
- Configure remote interpreter pointing to container
- Set up file synchronization
- Enable Django support

## 📊 Monitoring Development

### Performance Metrics
```bash
# Check resource usage
kubectl top pods -n geo-dashboard-dev

# Monitor file system events
kubectl exec -it <pod-name> -n geo-dashboard-dev -- tail -f /var/log/watchdog.log
```

### Development Analytics
- Track hot reload frequency
- Monitor build times
- Measure development productivity

## 🎉 Next Steps

After setting up hot reload:

1. **Configure your IDE** for optimal development experience
2. **Set up debugging** with breakpoints and interactive consoles
3. **Create custom development scripts** for your specific workflow
4. **Integrate with CI/CD** for seamless deployment
5. **Share the setup** with your team for consistent development

---

**Happy coding with hot reload! 🔥** Your changes now appear instantly in Kubernetes!

## 📞 Support

If you encounter issues:
- Check the troubleshooting section above
- View logs with `./dev-logs.sh`
- Restart the environment with `./stop-dev.sh && ./start-dev.sh`
- File an issue with detailed logs and configuration 