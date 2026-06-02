import logging
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from consumer import CHROMA_DIR, LocalLLM, MODEL_NAME, MODEL_URL, get_embeddings
from consumer import main as consumer_main
from langchain_community.vectorstores import Chroma

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    thread = threading.Thread(target=consumer_main, daemon=True)
    thread.start()
    logger.info("RabbitMQ consumer started in background thread")
    yield


app = FastAPI(
    title="ScriptumAI - AI Service",
    description="Asynchronous document processing with RAG via RabbitMQ",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatPayload(BaseModel):
    message: str
    organization_id: str


class GlobalChatPayload(BaseModel):
    message: str
    organization_id: str
    document_ids: List[str]
    document_names: dict[str, str] = {}


def load_org_vector_store(organization_id: str) -> Chroma:
    chroma_path = Path(CHROMA_DIR) / organization_id
    if not chroma_path.exists():
        raise HTTPException(status_code=404, detail='Document context not found')

    embedding_fn = get_embeddings()
    if embedding_fn is None:
        raise HTTPException(status_code=503, detail='Embeddings not available')

    return Chroma(
        persist_directory=str(chroma_path),
        embedding_function=embedding_fn,
    )


def answer_question(organization_id: str, document_id: str, message: str) -> str:
    vector_store = load_org_vector_store(organization_id)

    msg_lower = message.lower()
    is_summary = any(w in msg_lower for w in ['resum', 'sumari', 'sintetiz', 'summarize', 'summary', 'overview'])
    k = 8 if is_summary else 4

    docs = vector_store.similarity_search(
        message, k=k,
        filter={"document_id": document_id},
    )
    logger.info(f"Chat search for doc {document_id}: {len(docs)} chunks found")
    context = '\n\n'.join(doc.page_content for doc in docs if doc.page_content)
    logger.info(f"Context length: {len(context)} chars")

    llm = LocalLLM(model_url=MODEL_URL, model_name=MODEL_NAME, temperature=0.0)
    prompt = f"""You are a document analysis assistant. Answer the user's question based on the document content provided below.
If the user asks for a summary, provide a clear and complete summary using the available content.
If the information is not in the document, say so.
Always reply in the same language as the user's question.

Document content:
{context}

Question: {message}

Answer:"""

    return llm._call(prompt).strip()


@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "ScriptumAI - AI Service",
        "version": "1.0.0",
        "description": "Asynchronous document processing with RAG via RabbitMQ",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint for Docker healthcheck"""
    return {
        "status": "healthy",
        "service": "ai-service"
    }


@app.post("/documents/{document_id}/chat")
async def chat_with_document(document_id: str, payload: ChatPayload):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail='Message is required')

    answer = answer_question(payload.organization_id, document_id, message)
    return {
        "documentId": document_id,
        "answer": answer,
    }


def answer_global_question(
    organization_id: str,
    message: str,
    document_ids: List[str],
    document_names: dict[str, str],
) -> dict:
    vector_store = load_org_vector_store(organization_id)

    results = vector_store.similarity_search_with_relevance_scores(
        message, k=6,
        filter={"document_id": {"$in": document_ids}},
    )

    if not results:
        return {
            "answer": "Não foi possível encontrar informação relevante nos documentos disponíveis.",
            "sourceDocuments": [],
        }

    seen_doc_ids: dict[str, float] = {}
    context_parts: list[str] = []
    for doc, score in results:
        if not doc.page_content:
            continue
        doc_id = doc.metadata.get("document_id", "unknown")
        doc_name = document_names.get(doc_id, doc_id)
        context_parts.append(f"[Document: {doc_name}]\n{doc.page_content}")
        if doc_id not in seen_doc_ids or score > seen_doc_ids[doc_id]:
            seen_doc_ids[doc_id] = score

    context = '\n\n---\n\n'.join(context_parts)

    llm = LocalLLM(model_url=MODEL_URL, model_name=MODEL_NAME, temperature=0.0)
    prompt = f"""You are a contextual assistant for a document management platform.
Use only the provided document context to answer the question.
The context may come from multiple different documents — reference which document(s) the information comes from in your answer.
If the answer is not in the context, say that you could not find it in the available documents.
Always reply in the same language as the user's question.

Document context:
{context}

Question: {message}

Answer:"""

    answer = llm._call(prompt).strip()

    source_documents = [
        {"documentId": doc_id, "documentName": document_names.get(doc_id, doc_id), "relevanceScore": round(score, 4)}
        for doc_id, score in seen_doc_ids.items()
    ]
    source_documents.sort(key=lambda x: x["relevanceScore"], reverse=True)

    return {
        "answer": answer,
        "sourceDocuments": source_documents,
    }


@app.delete("/documents/{document_id}/embeddings")
async def delete_document_embeddings(document_id: str, payload: ChatPayload):
    chroma_path = Path(CHROMA_DIR) / payload.organization_id
    if not chroma_path.exists():
        return {"deleted": 0}

    embedding_fn = get_embeddings()
    if embedding_fn is None:
        return {"deleted": 0}

    vector_store = Chroma(
        persist_directory=str(chroma_path),
        embedding_function=embedding_fn,
    )

    results = vector_store.get(where={"document_id": document_id})
    ids_to_delete = results.get("ids", [])
    if ids_to_delete:
        vector_store.delete(ids=ids_to_delete)
        vector_store.persist()

    return {"deleted": len(ids_to_delete)}


@app.post("/documents/global-chat")
async def global_chat(payload: GlobalChatPayload):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail='Message is required')

    if not payload.document_ids:
        raise HTTPException(status_code=400, detail='At least one document ID is required')

    result = answer_global_question(
        payload.organization_id, message, payload.document_ids, payload.document_names,
    )
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
