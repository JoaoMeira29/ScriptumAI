# ScriptumAI

**Disciplina:** Projeto de Computação na Cloud + AIService  
**Curso:** Mestrado em Engenharia Informática (MEI)  
**Instituição:** IPCA - EST  
**Ano Letivo:** 2025/2026

---

## Sobre o Projeto

**ScriptumAI** é uma plataforma de gestão documental com processamento inteligente por IA.
O projeto segue uma arquitetura de microsserviços, com comunicação assíncrona via RabbitMQ,
armazenamento de ficheiros em MinIO (S3-compatible) e um frontend web em Next.js.

---

## Arquitetura de Microsserviços

Seis microsserviços atrás de um API Gateway NGINX (porta 80), todos numa rede Docker `scriptumai-network`.

| Serviço | Framework | ORM | Base de Dados | Porta |
|---------|-----------|-----|---------------|-------|
| pwa-service | Next.js 16 | — | — | 3000 |
| authentication-service | Express.js | Sequelize | PostgreSQL (`auth_db`) | 3001 |
| organization-service | NestJS | Prisma 6.x | PostgreSQL (`organization_db`) | 3002 |
| document-service | NestJS + Fastify | Drizzle 0.44 | PostgreSQL (`document_db`) | 3003 |
| ai-service | Python / FastAPI | — | ChromaDB | 8000 |
| notification-service | Express.js | Prisma | PostgreSQL (`notification_db`) | 3005 |

**Infraestrutura:** PostgreSQL 16, MinIO (S3-compatible), RabbitMQ 3.

### Routing (API Gateway)

| Rota | Serviço |
|------|---------|
| `/api/auth/*` | authentication-service |
| `/api/organizations/*` | organization-service |
| `/api/memberships/*` | organization-service |
| `/api/invites/*` | organization-service |
| `/api/documents/*` | document-service |
| `/api/notifications/*` | notification-service |
| `/files/*` | MinIO (proxy) |

### Comunicação entre Serviços

**RabbitMQ** (exchange: `scriptumai.events`):

| Routing Key | Produtor | Consumidor |
|---|---|---|
| `document.uploaded` | document-service | ai-service |
| `document.processed` | ai-service | document-service |
| `document.ai.completed` | document-service | notification-service |
| `invite.created` | organization-service | notification-service |
| `user.created` | organization-service | notification-service |
| `trial.expired` | organization-service | notification-service |

**HTTP interno:** document-service → organization-service (subscrições e departamentos), document-service → ai-service (chat e embeddings)

---

## AI Service

Pipeline RAG (Retrieval-Augmented Generation) para processamento inteligente de documentos:

- **LangChain** para orquestração do pipeline
- **ChromaDB** como vector store para embeddings
- **sentence-transformers** (paraphrase-multilingual-MiniLM-L12-v2) para embeddings multilingue
- **Ollama** (LLaMA 3.1) como LLM local para análise e sumarização
- **Tesseract OCR** para PDFs digitalizados e imagens

**Formatos suportados:** PDF, DOCX, TXT, JPG, PNG

**Funcionalidades:**
- Extração de texto e OCR
- Sumarização automática via LLM
- Embeddings por organização (multi-tenant)
- Chat por documento (RAG com contexto)
- Chat global (RAG sobre múltiplos documentos com indicação de fontes)
- Deteção automática de idioma (PT/EN)

---

## Quick Start

### Pré-requisitos
- Docker & Docker Compose
- Ollama com modelo `llama3.1` (para funcionalidades de IA)

### Iniciar ambiente local
```bash
# Clonar o repositório
git clone https://github.com/IPCA-MEI-13Edicao/G3-API.git
cd G3-API

# Iniciar todos os serviços
docker compose up -d

# Rebuild de serviços específicos após alterações
docker compose up -d --build organization-service document-service

# Ver logs de um serviço
docker compose logs <service-name> --tail 50
```

### Serviços disponíveis

| Serviço | Porta | URL |
|---------|-------|-----|
| PWA (Next.js) | 3000 | http://localhost:3000 |
| API Gateway (NGINX) | 80 | http://localhost |
| AI Service | 8000 | http://localhost:8000 |
| Document Service | 3003 | http://localhost:3003 |
| Auth Service | 3001 | http://localhost:3001 |
| Organization Service | 3002 | http://localhost:3002 |
| Notification Service | 3005 | http://localhost:3005 |
| RabbitMQ Management | 15672 | http://localhost:15672 |
| MinIO Console | 9001 | http://localhost:9001 |

### Documentação da API (OpenAPI)

| Serviço | URL |
|---------|-----|
| document-service | http://localhost:3003/docs |
| organization-service | http://localhost:3002/api/docs |
| authentication-service | http://localhost:3001/api-docs |
| notification-service | http://localhost:3005/api-docs |
| ai-service | http://localhost:8000/docs |

---

## Estrutura do Projeto
```
G3-API/
├── services/
│   ├── api-gateway/              # NGINX reverse proxy
│   ├── pwa-service/              # Frontend web (Next.js 16)
│   ├── authentication-service/   # Auth + JWT
│   ├── organization-service/     # Orgs, membros, departamentos
│   ├── document-service/         # Documentos + chat IA
│   ├── ai-service/               # RAG pipeline (Python)
│   └── notification-service/     # Emails + Push Notifications
│
├── infra/                        # Seed data, configs PostgreSQL
├── k8s/                          # Kubernetes manifests
├── docs/                         # Diagrama de arquitetura
├── requisitos-avancados/         # Requisitos avançados (servidor, cliente, distribuição)
│
├── .github/workflows/            # CI/CD (GitHub Actions)
├── docker-compose.yaml
└── README.md
```

---

## Diagrama de Arquitetura

Disponível em [`docs/architecture-diagram.md`](docs/architecture-diagram.md) (Mermaid — renderiza automaticamente no GitHub).

---

## Repositório Relacionado

- [G3-PADM](https://github.com/IPCA-MEI-13Edicao/G3-PADM) — App móvel Android (Kotlin + Jetpack Compose)

---

## Equipa

- **Pedro Seara** (23079)
- **João Meira** (23505)
- **Leonardo Vieira** (34688)

---

## Licença

Projeto desenvolvido para fins académicos no âmbito do Mestrado em Engenharia Informática do IPCA - EST.
