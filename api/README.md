# ScriptumAI — API

Backend microservices for the ScriptumAI document management platform.

## Architecture

Six microservices behind an NGINX API Gateway on port 80, all running on a shared Docker network (`scriptumai-network`).

| Service | Framework | ORM | Database | Port |
|---------|-----------|-----|----------|------|
| api-gateway | NGINX | — | — | 80 |
| authentication-service | Express.js | Sequelize | PostgreSQL (`auth_db`) | 3001 |
| organization-service | NestJS | Prisma 6.x | PostgreSQL (`organization_db`) | 3002 |
| document-service | NestJS + Fastify | Drizzle 0.44 | PostgreSQL (`document_db`) | 3003 |
| ai-service | Python / FastAPI | — | ChromaDB | 8000 |
| notification-service | Express.js | Prisma | PostgreSQL (`notification_db`) | 3005 |

**Infrastructure:** PostgreSQL 16, MinIO (S3-compatible), RabbitMQ 3.

## API Routing

| Route | Service |
|-------|---------|
| `/api/auth/*` | authentication-service |
| `/api/organizations/*` | organization-service |
| `/api/memberships/*` | organization-service |
| `/api/invites/*` | organization-service |
| `/api/documents/*` | document-service |
| `/api/notifications/*` | notification-service |
| `/files/*` | MinIO (proxy) |

## Service Communication

**RabbitMQ** (exchange: `scriptumai.events`):

| Routing Key | Producer | Consumer |
|-------------|----------|----------|
| `document.uploaded` | document-service | ai-service |
| `document.processed` | ai-service | document-service |
| `document.ai.completed` | document-service | notification-service |
| `invite.created` | organization-service | notification-service |
| `user.created` | organization-service | notification-service |
| `trial.expired` | organization-service | notification-service |

**Internal HTTP:** document-service → organization-service (subscriptions & departments), document-service → ai-service (chat & embeddings).

## AI Service

RAG (Retrieval-Augmented Generation) pipeline for intelligent document processing:

- **LangChain** for pipeline orchestration
- **ChromaDB** as vector store for embeddings
- **sentence-transformers** (`paraphrase-multilingual-MiniLM-L12-v2`) for multilingual embeddings
- **Ollama** (LLaMA 3.1) as local LLM for analysis and summarization
- **Tesseract OCR** for scanned PDFs and images

**Supported formats:** PDF, DOCX, TXT, JPG, PNG

**Capabilities:**
- Text extraction and OCR
- Automatic summarization via LLM
- Per-organization embeddings (multi-tenant)
- Per-document chat (RAG with context)
- Global chat (RAG across multiple documents with source attribution)
- Automatic language detection (PT/EN)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Ollama with the `llama3.1` model (for AI features)

### Running locally

```bash
cd api

# Copy and configure environment variables
cp .env.example .env

# Start all services
docker compose up -d

# Rebuild specific services after changes
docker compose up -d --build organization-service document-service

# View logs for a service
docker compose logs <service-name> --tail 50
```

### Available services

| Service | Port | URL |
|---------|------|-----|
| API Gateway (NGINX) | 80 | http://localhost |
| Authentication Service | 3001 | http://localhost:3001 |
| Organization Service | 3002 | http://localhost:3002 |
| Document Service | 3003 | http://localhost:3003 |
| Notification Service | 3005 | http://localhost:3005 |
| AI Service | 8000 | http://localhost:8000 |
| RabbitMQ Management | 15672 | http://localhost:15672 |
| MinIO Console | 9001 | http://localhost:9001 |

### API Documentation (OpenAPI)

| Service | URL |
|---------|-----|
| document-service | http://localhost:3003/docs |
| organization-service | http://localhost:3002/api/docs |
| authentication-service | http://localhost:3001/api-docs |
| notification-service | http://localhost:3005/api-docs |
| ai-service | http://localhost:8000/docs |

## Project Structure

```
api/
├── services/
│   ├── api-gateway/              # NGINX reverse proxy
│   ├── authentication-service/   # Auth + JWT
│   ├── organization-service/     # Orgs, members, departments
│   ├── document-service/         # Documents + AI chat
│   ├── ai-service/               # RAG pipeline (Python)
│   └── notification-service/     # Emails + push notifications
├── infra/                        # Seed data, PostgreSQL configs
├── k8s/                          # Kubernetes manifests
├── k6/                           # Load & stress tests
├── terraform/                    # Infrastructure as code
├── postman/                      # API collections
├── advanced-requirements/        # Requirements documentation
├── .github/workflows/            # CI/CD (GitHub Actions)
└── docker-compose.yaml
```
