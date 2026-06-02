# Requisitos Avançados — Distribuição

## 1. Load Balancer e API Gateway — NGINX

API Gateway centralizado em NGINX (porta 80) com reverse proxy para todos os microsserviços:

- Routing baseado em path (`/api/auth/*`, `/api/documents/*`, `/files/*`, etc.)
- **WebSocket support:** headers `Upgrade` e `Connection` para comunicação real-time
- CORS configurado no gateway
- Timeouts otimizados: `proxy_read_timeout: 300s` para endpoints de upload/AI
- Limite de upload: `client_max_body_size: 100M`
- Health check endpoint próprio: `/health`

## 2. Kubernetes — Manifests para Deployment em Cluster

Configuração completa em `k8s/` com 13 manifests:

- **Namespace:** `scriptumai` (isolamento lógico no cluster)
- **Deployments:** todos os serviços aplicacionais com resource limits
- **ConfigMap:** `nginx-config` para configuração do API Gateway
- **HPA (Horizontal Pod Autoscaler):**
  - API Gateway: min 2, max 10 réplicas (CPU 70%, Memory 80%)
  - Serviços aplicacionais: min 1-3, max 5 réplicas
  - Escalamento automático baseado em métricas de CPU e memória
- **RabbitMQ:** deployment dedicado com persistent volume
- **Monitorização:**
  - **Prometheus:** recolha de métricas do cluster
  - **Grafana:** dashboards de visualização (com JSON pré-configurado em `grafana-scriptumai-dashboard.json`)
  - **Kube State Metrics:** métricas de estado dos objetos Kubernetes

## 3. CI/CD — GitHub Actions

Pipelines automatizados em `.github/workflows/`:

| Workflow | Trigger | Função |
|---|---|---|
| `ci.yml` | Push em `develop`, `feature/**`, `feat/**`, `fix/**`; PRs | Lint e type-check de todos os serviços |

Matrix strategy para testar todos os serviços em paralelo.
