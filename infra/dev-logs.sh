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
