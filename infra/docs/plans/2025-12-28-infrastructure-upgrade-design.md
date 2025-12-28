# Infrastructure Upgrade Design

**Date:** 2025-12-28
**Status:** Approved
**Goal:** Upgrade databases, migrate to FastAPI, add APISIX gateway with Keycloak auth, and implement full observability stack

---

## Executive Summary

Complete infrastructure overhaul to support the Django → FastAPI migration with:
- PostgreSQL 17 + PostGIS 3.5 (upgraded from 15)
- APISIX API gateway with Keycloak OIDC integration
- Keycloak + FastAPI-Users hybrid authentication
- Full observability: Prometheus, Loki, Alloy, Grafana
- Multi-environment support (dev/staging/prod)

---

## Architecture

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                        INGRESS                              │
                                    │  maps.tardis.digital | auth.tardis.digital | grafana...    │
                                    └─────────────────────────────────────────────────────────────┘
                                                              │
                                                              ▼
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                    APISIX + etcd                            │
                                    │         (JWT validation via Keycloak OIDC)                  │
                                    └──────┬──────────┬──────────┬──────────┬────────────────────┘
                                           │          │          │          │
                         ┌─────────────────┘          │          │          └─────────────────┐
                         ▼                            ▼          ▼                            ▼
                ┌─────────────────┐          ┌──────────────────────────┐            ┌─────────────────┐
                │   FastAPI API   │          │   Martin    │  TiTiler   │            │    Keycloak     │
                │   (2-3 replicas)│          │   (3-4)     │   (1-2)    │            │    (1 replica)  │
                │   Port 8000     │          │   :3000     │   :8000    │            │    Port 8080    │
                └────────┬────────┘          └──────────────────────────┘            └────────┬────────┘
                         │                                                                    │
                         │ internal                                                           │
                         ▼                                                                    │
                ┌─────────────────┐                                                           │
                │   ETL Service   │                                                           │
                │   Port 8001     │                                                           │
                └────────┬────────┘                                                           │
                         │                                                                    │
         ┌───────────────┼───────────────┐                                                    │
         ▼               ▼               ▼                                                    ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                    ┌─────────────┐
│ PostgreSQL  │  │    Redis    │  │   Tile      │                                    │  Keycloak   │
│ 17+PostGIS  │  │      7      │  │  Storage    │                                    │  PostgreSQL │
│  3.5        │  │             │  │   (PV)      │                                    │             │
└─────────────┘  └─────────────┘  └─────────────┘                                    └─────────────┘
```

### Domains

| Domain | Service | Purpose |
|--------|---------|---------|
| `maps.tardis.digital` | APISIX | `/api/*`, `/tiles/*`, `/raster/*` |
| `auth.tardis.digital` | Keycloak | Authentication/SSO |
| `grafana.tardis.digital` | Grafana | Observability dashboards |

### Auth Flow

```
Client → APISIX (validates Keycloak JWT) → FastAPI services
              ↓
         Keycloak (OIDC provider)
```

---

## Directory Structure

```
infra/
├── base/                           # Shared configs
│   ├── namespace.yaml
│   ├── storage-class.yaml
│   └── secrets.yaml                # Sealed/external secrets reference
│
├── database/
│   ├── postgres-statefulset.yaml   # PG 17 + PostGIS 3.5
│   ├── postgres-service.yaml
│   ├── postgres-pvc.yaml
│   └── kustomization.yaml
│
├── core/                           # FastAPI main API
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   ├── api-configmap.yaml
│   └── kustomization.yaml
│
├── etl/                            # ETL microservice (internal)
│   ├── etl-deployment.yaml
│   ├── etl-service.yaml            # ClusterIP only
│   └── kustomization.yaml
│
├── tiler/
│   ├── martin-deployment.yaml
│   ├── martin-service.yaml
│   ├── titiler-deployment.yaml
│   ├── titiler-service.yaml
│   └── kustomization.yaml
│
├── gateway/                        # APISIX + etcd
│   ├── etcd-statefulset.yaml
│   ├── apisix-deployment.yaml
│   ├── apisix-configmap.yaml       # Routes, upstreams
│   ├── apisix-service.yaml
│   └── kustomization.yaml
│
├── auth/                           # Keycloak
│   ├── keycloak-deployment.yaml
│   ├── keycloak-service.yaml
│   ├── keycloak-configmap.yaml     # Realm defaults
│   ├── keycloak-postgres.yaml      # Dedicated DB
│   └── kustomization.yaml
│
├── cache/                          # Redis
│   ├── redis-deployment.yaml
│   ├── redis-service.yaml
│   └── kustomization.yaml
│
├── observability/
│   ├── prometheus/
│   │   ├── prometheus-deployment.yaml
│   │   ├── prometheus-configmap.yaml
│   │   ├── pg-exporter-deployment.yaml
│   │   └── redis-exporter-deployment.yaml
│   ├── loki/
│   │   ├── loki-statefulset.yaml
│   │   └── loki-configmap.yaml
│   ├── alloy/
│   │   ├── alloy-daemonset.yaml
│   │   └── alloy-configmap.yaml
│   ├── grafana/
│   │   ├── grafana-deployment.yaml
│   │   ├── grafana-configmap.yaml  # Datasources, dashboards
│   │   └── grafana-ingress.yaml
│   └── kustomization.yaml
│
├── ingress/
│   ├── apisix-ingress.yaml         # maps.tardis.digital
│   ├── keycloak-ingress.yaml       # auth.tardis.digital
│   └── grafana-ingress.yaml        # grafana.tardis.digital
│
├── overlays/
│   ├── dev/
│   │   ├── kustomization.yaml      # Small resources, 1 replica
│   │   ├── patches/
│   │   └── secrets.yaml
│   ├── staging/
│   │   ├── kustomization.yaml      # Medium resources
│   │   ├── patches/
│   │   └── secrets.yaml
│   └── prod/
│       ├── kustomization.yaml      # Medium+ resources, HA
│       ├── patches/
│       └── secrets.yaml
│
└── kustomization.yaml              # Root kustomization
```

---

## Component Specifications

### Database Layer

**PostgreSQL 17 + PostGIS 3.5 (Main):**

```yaml
image: postgis/postgis:17-3.5
resources:
  requests: { memory: "2Gi", cpu: "1000m" }
  limits: { memory: "4Gi", cpu: "2000m" }
extensions:
  - postgis
  - postgis_topology
  - postgis_raster
  - pgrouting
  - hstore
  - pg_stat_statements
```

**Keycloak PostgreSQL (Dedicated):**

```yaml
image: postgres:17-alpine
resources:
  requests: { memory: "256Mi", cpu: "100m" }
  limits: { memory: "512Mi", cpu: "250m" }
```

**Redis 7:**

```yaml
image: redis:7-alpine
resources:
  requests: { memory: "256Mi", cpu: "100m" }
  limits: { memory: "512Mi", cpu: "250m" }
persistence: false  # Cache/queue, can restart
```

### Gateway Layer

**APISIX + etcd:**

```yaml
# etcd
image: bitnami/etcd:3.5
replicas: 1  # overlay: prod=3

# APISIX
image: apache/apisix:3.8-debian
replicas: 2  # overlay: dev=1, prod=2-3
```

**Route Configuration:**

```yaml
routes:
  - uri: /api/*
    upstream: fastapi-api:8000
    plugins:
      - openid-connect:
          discovery: https://auth.tardis.digital/realms/maps/.well-known/openid-configuration
          client_id: maps-api
          bearer_only: true
      - prometheus: {}

  - uri: /tiles/*
    upstream: martin:3000
    plugins:
      - proxy-rewrite:
          regex_uri: ["^/tiles/(.*)", "/$1"]
      - prometheus: {}

  - uri: /raster/*
    upstream: titiler:8000
    plugins:
      - proxy-rewrite:
          regex_uri: ["^/raster/(.*)", "/$1"]
      - prometheus: {}
```

### Authentication Layer

**Keycloak:**

```yaml
image: quay.io/keycloak/keycloak:24.0
command: ["start", "--optimized"]
env:
  KC_DB: postgres
  KC_HOSTNAME: auth.tardis.digital
  KC_PROXY: edge
  KC_HEALTH_ENABLED: true
  KC_METRICS_ENABLED: true
```

**Realm Defaults:**

| Setting | Value |
|---------|-------|
| Realm | `maps` |
| Clients | `maps-frontend` (public), `maps-api` (confidential) |
| Roles | `admin`, `editor`, `viewer` |
| Token lifespan | Access: 5min, Refresh: 30min |
| Password policy | 8+ chars, 1 uppercase, 1 number |
| Brute force | Enabled, 5 failures = 5min lockout |

### Application Layer

**FastAPI Main API:**

```yaml
image: pronittardis/maps-api:latest
replicas: 2  # overlay: dev=1, prod=3
port: 8000
resources:
  requests: { memory: "512Mi", cpu: "250m" }
  limits: { memory: "1Gi", cpu: "500m" }
env:
  DATABASE_URL: postgresql+asyncpg://...
  REDIS_URL: redis://redis:6379/0
  ETL_SERVICE_URL: http://etl-service:8001
  KEYCLOAK_URL: https://auth.tardis.digital
  KEYCLOAK_REALM: maps
probes:
  readiness: /health
  liveness: /health
```

**ETL Service (internal):**

```yaml
image: pronittardis/maps-etl:latest
replicas: 1  # overlay: prod=2
port: 8001
service: ClusterIP  # No external access
resources:
  requests: { memory: "1Gi", cpu: "500m" }
  limits: { memory: "2Gi", cpu: "1000m" }
volumes:
  - uploads: /app/uploads (PVC)
```

**Tilers:**

```yaml
# Martin (vector)
image: ghcr.io/maplibre/martin:v0.14.0
replicas: 3  # overlay: dev=1, prod=4
port: 3000

# TiTiler (raster)
image: ghcr.io/developmentseed/titiler:0.18.0
replicas: 1  # overlay: prod=2
port: 8000
```

### Observability Layer

**Prometheus:**

```yaml
image: prom/prometheus:v2.50.0
replicas: 1
retention: 15d
storage: 10Gi  # overlay: prod=50Gi

scrape_configs:
  - kubernetes-pods
  - apisix-metrics
  - pg-exporter:9187
  - redis-exporter:9121
  - keycloak:8080/metrics
```

**Exporters:**

```yaml
# PostgreSQL exporter
image: prometheuscommunity/postgres-exporter:v0.15.0

# Redis exporter
image: oliver006/redis_exporter:v1.58.0
```

**Loki:**

```yaml
image: grafana/loki:2.9.4
replicas: 1
storage: 10Gi  # overlay: prod=50Gi
retention: 7d  # overlay: prod=30d
```

**Alloy:**

```yaml
image: grafana/alloy:v1.0.0
kind: DaemonSet
config:
  - kubernetes.logs
  - stage.json
  - labels: [namespace, pod, container]
```

**Grafana:**

```yaml
image: grafana/grafana:10.4.0
replicas: 1
plugins:
  - grafana-piechart-panel

datasources:
  - prometheus (default)
  - loki

dashboards:
  - kubernetes-cluster
  - apisix-gateway
  - postgresql-database
  - redis
  - fastapi-application
  - keycloak
```

---

## Environment Sizing

### Resource Allocation by Environment

| Component | Dev | Staging | Prod |
|-----------|-----|---------|------|
| Main PostgreSQL | 1Gi/500m | 2Gi/1 CPU | 4Gi/2 CPU |
| Keycloak PostgreSQL | 128Mi/50m | 256Mi/100m | 512Mi/250m |
| Redis | 128Mi/50m | 256Mi/100m | 512Mi/250m |
| FastAPI API | 256Mi/125m | 512Mi/250m | 1Gi/500m |
| ETL Service | 512Mi/250m | 1Gi/500m | 2Gi/1 CPU |

### Replica Counts by Environment

| Component | Dev | Staging | Prod |
|-----------|-----|---------|------|
| PostgreSQL | 1 | 1 | 1 |
| Keycloak PostgreSQL | 1 | 1 | 1 |
| Redis | 1 | 1 | 1 |
| FastAPI API | 1 | 2 | 3 |
| ETL Service | 1 | 1 | 2 |
| Martin | 1 | 3 | 4 |
| TiTiler | 1 | 1 | 2 |
| APISIX | 1 | 2 | 2 |
| etcd | 1 | 1 | 3 |
| Keycloak | 1 | 1 | 2 |
| Prometheus | 1 | 1 | 1 |
| Loki | 1 | 1 | 1 |
| Grafana | 1 | 1 | 1 |

### Observability Resources

| Component | Requests | Limits |
|-----------|----------|--------|
| Prometheus | 512Mi/250m | 1Gi/500m |
| Loki | 256Mi/100m | 512Mi/250m |
| Alloy (per node) | 64Mi/50m | 128Mi/100m |
| Grafana | 256Mi/100m | 512Mi/250m |
| pg-exporter | 32Mi/25m | 64Mi/50m |
| redis-exporter | 32Mi/25m | 64Mi/50m |

---

## Complete Component Summary

| Component | Image | Purpose |
|-----------|-------|---------|
| PostgreSQL + PostGIS | `postgis/postgis:17-3.5` | Main spatial database |
| Keycloak PostgreSQL | `postgres:17-alpine` | Keycloak database |
| Redis | `redis:7-alpine` | Cache + task queue |
| FastAPI API | `pronittardis/maps-api` | Main REST API |
| ETL Service | `pronittardis/maps-etl` | Import/analysis (internal) |
| Martin | `ghcr.io/maplibre/martin:v0.14.0` | Vector tile server |
| TiTiler | `ghcr.io/developmentseed/titiler:0.18.0` | Raster tile server |
| APISIX | `apache/apisix:3.8-debian` | API gateway |
| etcd | `bitnami/etcd:3.5` | APISIX config store |
| Keycloak | `quay.io/keycloak/keycloak:24.0` | Identity provider |
| Prometheus | `prom/prometheus:v2.50.0` | Metrics collection |
| Loki | `grafana/loki:2.9.4` | Log aggregation |
| Alloy | `grafana/alloy:v1.0.0` | Log collector |
| Grafana | `grafana/grafana:10.4.0` | Dashboards |
| pg-exporter | `prometheuscommunity/postgres-exporter:v0.15.0` | PostgreSQL metrics |
| redis-exporter | `oliver006/redis_exporter:v1.58.0` | Redis metrics |

---

## Migration Path

### Breaking Changes

| Change | Migration Action |
|--------|------------------|
| PG 15 → PG 17 | pg_dump/restore or pg_upgrade |
| Django → FastAPI | New image, same DB tables |
| No auth → Keycloak | Import existing users or fresh start |
| Direct ingress → APISIX | Update DNS, new routing |

### Deployment Order

1. **Base** - namespace, storage-class, secrets
2. **Database** - PostgreSQL 17, migrate data
3. **Cache** - Redis
4. **Auth** - Keycloak + its PostgreSQL
5. **Gateway** - etcd, then APISIX
6. **Core services** - API, ETL, tilers
7. **Observability** - Prometheus, Loki, Alloy, Grafana
8. **Ingress** - all three domains

### Implementation Phases

**Phase 1: Foundation**
- [ ] Restructure infra directory
- [ ] Create base kustomization
- [ ] Set up overlay structure (dev/staging/prod)
- [ ] Create secret templates

**Phase 2: Database & Cache**
- [ ] Upgrade PostgreSQL to 17 + PostGIS 3.5
- [ ] Add Redis deployment
- [ ] Configure pg_stat_statements
- [ ] Test database connectivity

**Phase 3: Authentication**
- [ ] Deploy Keycloak PostgreSQL
- [ ] Deploy Keycloak with realm config
- [ ] Configure clients (frontend, api)
- [ ] Set up default roles and policies

**Phase 4: Gateway**
- [ ] Deploy etcd cluster
- [ ] Deploy APISIX with route config
- [ ] Configure Keycloak OIDC plugin
- [ ] Test auth flow end-to-end

**Phase 5: Application Services**
- [ ] Update core API deployment for FastAPI
- [ ] Add ETL service deployment
- [ ] Update Martin configuration
- [ ] Update TiTiler configuration

**Phase 6: Observability**
- [ ] Deploy Prometheus + exporters
- [ ] Deploy Loki
- [ ] Deploy Alloy DaemonSet
- [ ] Deploy Grafana with dashboards
- [ ] Verify metrics and logs collection

**Phase 7: Ingress & DNS**
- [ ] Configure APISIX ingress (maps.tardis.digital)
- [ ] Configure Keycloak ingress (auth.tardis.digital)
- [ ] Configure Grafana ingress (grafana.tardis.digital)
- [ ] Update DNS records
- [ ] Verify TLS certificates

---

## Related Documents

- [FastAPI + Rust Migration Design](../../../backend/docs/plans/2025-12-28-fastapi-rust-migration-design.md)
