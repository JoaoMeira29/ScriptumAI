# ScriptumAI

ScriptumAI is a multi-tenant SaaS platform for intelligent document processing and management, conceived as an **AIaaS (AI as a Service)** solution. A single instance serves multiple organizations from any industry simultaneously, with complete data isolation between tenants.

Small and medium-sized organizations face growing challenges in managing their documents efficiently — increasing volume, heterogeneous formats, slow manual search, and lack of intelligent automation. ScriptumAI addresses this by combining a microservices backend with an AI pipeline based on **RAG (Retrieval-Augmented Generation)**, making advanced document capabilities accessible without the cost of a dedicated infrastructure.

### Key features

- **Document management** — upload, organize, search, and access documents with role-based permissions (Administrator, Manager, Client), department-level organization, and metadata editing
- **Automatic AI processing** — text extraction (including OCR), automatic summarization, and keyword identification via LLM
- **RAG chatbot** — conversational assistant that answers questions grounded in the organization's own documents, using multilingual embeddings and Llama 3.1; access controlled by subscription quota
- **Mobile app** — full feature access on Android (Kotlin + Jetpack Compose, Material Design)
- **Multi-tenant isolation** — each organization operates in a fully isolated logical space; no cross-tenant data access
- **Security** — JWT authentication, RBAC, full audit logging, TLS-encrypted communications

## Repositories

| Folder                | Description           | Stack                    |
| --------------------- | --------------------- | ------------------------ |
| [`mobile/`](./mobile) | Android mobile app    | Kotlin + Jetpack Compose |
| [`web/`](./web)       | Progressive Web App   | Next.js + TypeScript     |
| [`api/`](./api)       | Backend microservices | Node.js, Python, NGINX   |

## Overview

ScriptumAI allows users and organizations to upload, manage, and interact with documents using AI. Features include OCR processing, RAG-based chat per document, automatic summarization, and multi-tenant organization support.

## Architecture

Six microservices behind an NGINX API Gateway, communicating via RabbitMQ, with file storage on MinIO (S3-compatible) and PostgreSQL databases.

```
ScriptumAI/
├── mobile/     # Android app (Kotlin + Jetpack Compose)
├── web/        # PWA frontend (Next.js)
└── api/        # Microservices + infrastructure
    └── services/
        ├── api-gateway/            # NGINX reverse proxy
        ├── authentication-service/ # Auth + JWT
        ├── organization-service/   # Orgs, members, departments
        ├── document-service/       # Documents + AI chat
        ├── ai-service/             # RAG pipeline (Python/FastAPI)
        └── notification-service/   # Emails + push notifications
```

## Team

- **Pedro Seara** (23079)
- **João Meira** (23505)
- **Leonardo Vieira** (34688)

---

## License

© 2026 Pedro Seara, João Meira, Leonardo Vieira. All rights reserved.

This project and all its contents — including source code, documentation, and assets — are the exclusive property of the authors. No part of this repository may be reproduced, copied, distributed, modified, or used in any form without the prior written permission of the authors.

_Developed for the Master's in Computer Engineering (MEI) at IPCA - EST._
