# Requisitos Avançados — Servidor

## 1. Arquitetura de Microsserviços

Seis microsserviços independentes, cada um com o seu próprio ciclo de deploy:

| Serviço | Framework | ORM | Base de Dados |
|---|---|---|---|
| pwa-service | Next.js 16 | — | — |
| authentication-service | Express.js | Sequelize | `auth_db` |
| organization-service | NestJS | Prisma 6.x | `organization_db` |
| document-service | NestJS + Fastify | Drizzle 0.44 | `document_db` |
| ai-service | FastAPI (Python) | — | ChromaDB |
| notification-service | Express.js | Prisma | `notification_db` |

- Comunicação assíncrona via RabbitMQ (event-driven)
- Comunicação síncrona via HTTP interno entre serviços
- API Gateway (NGINX) como ponto de entrada único
- Base de dados isolada por serviço (database-per-service pattern)
- Cada serviço é um container Docker independente, deployável separadamente

## 2. Upload e Exposição de Ficheiros

- Armazenamento de ficheiros via **MinIO** (object storage S3-compatible)
- Suporte para PDF, DOCX, TXT, JPG e PNG
- Upload multipart via `@fastify/multipart` com limite de 50MB por ficheiro
- Proxy transparente de ficheiros via NGINX (`/files/*` → MinIO)
- Organização por tenant: `{organizationId}/{ano}/{mes}/{documentId}.{ext}`

## 3. Message Broker — RabbitMQ

Comunicação assíncrona entre serviços via **RabbitMQ** com topic exchange (`scriptumai.events`):

| Routing Key | Produtor | Consumidor |
|---|---|---|
| `document.uploaded` | document-service | ai-service |
| `document.processed` | ai-service | document-service |
| `document.ai.completed` | document-service | notification-service |
| `invite.created` | organization-service | notification-service |
| `user.created` | organization-service | notification-service |
| `trial.expired` | organization-service | notification-service |

Filas duráveis com mensagens persistentes e retry automático.

## 4. Motores de Base de Dados Complementares

Além do PostgreSQL (requisito base), o projeto utiliza:

- **ChromaDB:** base de dados vetorial para armazenamento de embeddings semânticos, com coleções isoladas por organização
- **MinIO:** object storage S3-compatible para persistência de ficheiros binários

## 5. Inteligência Artificial — RAG (Retrieval-Augmented Generation)

Pipeline completo de processamento de documentos com IA, implementado em Python (FastAPI):

- **Embeddings:** modelo `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (HuggingFace)
- **Vector Store:** ChromaDB com persistência, isolado por organização
- **LLM:** Ollama (LLaMA 3.1) para geração de resumos, extração de entidades e keywords
- **Text Splitting:** LangChain `RecursiveCharacterTextSplitter` para chunking
- **Document Loaders:** PyPDFLoader, Docx2txtLoader, TextLoader, PIL (imagens)
- **Chat por documento:** similarity search com k=4 (queries normais) ou k=8 (resumos)
- **Chat global:** similarity search com relevance scores cruzando múltiplos documentos, com indicação das fontes utilizadas

## 6. OCR (Optical Character Recognition)

- **Tesseract OCR** (`por+eng`) para imagens e PDFs digitalizados
- Suporte para JPG, PNG, WebP, BMP, TIFF
- Fallback automático para PDFs: se texto extraído < 50 caracteres, converte páginas em imagens (300 DPI) e aplica OCR

## 7. Documentação da API — OpenAPI

Todos os serviços expõem documentação interativa com 100% dos endpoints documentados:

| Serviço | Tecnologia | URL Local |
|---|---|---|
| document-service | @nestjs/swagger + Scalar UI | `http://localhost:3003/docs` |
| organization-service | @nestjs/swagger | `http://localhost:3002/api/docs` |
| notification-service | swagger-ui-express + swagger-jsdoc | `http://localhost:3005/api-docs` |
| authentication-service | swagger-ui-express + swagger-jsdoc | `http://localhost:3001/api-docs` |
| ai-service | FastAPI (auto-generated) | `http://localhost:8000/docs` |

## 8. Multi-Tenancy

Isolamento completo de dados por organização em todas as camadas:

- JWT token inclui `organizationId` — todas as queries filtram por organização
- ChromaDB com diretório separado por organização
- MinIO com prefixo de path por organização
- Departamentos e memberships scoped por organização
- Zero cruzamento de dados entre tenants
