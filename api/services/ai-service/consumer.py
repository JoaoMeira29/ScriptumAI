import pika
import json
import logging
import os
import requests
from datetime import datetime
from time import sleep
import traceback
from pathlib import Path
import tempfile

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.schema import Document as LCDocument
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.llms.base import LLM
from langchain.callbacks.manager import CallbackManagerForLLMRun
from typing import List, Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://rabbitmq:rabbitmq@rabbitmq:5672?heartbeat=300')
EXCHANGE = 'scriptumai.events'
QUEUE = 'ai-service.upload'
ROUTING_KEY = 'document.uploaded'

# RAG configuration
MODEL_URL = os.getenv("MODEL_URL", "http://localhost:1234")
MODEL_NAME = os.getenv("MODEL_NAME", "llama3.1")
MODEL_TIMEOUT_SECONDS = int(os.getenv("MODEL_TIMEOUT_SECONDS", "180"))
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
CHROMA_DIR = Path("chroma_db")
CHROMA_DIR.mkdir(exist_ok=True)

# Custom class for local LLM
class LocalLLM(LLM):
    model_url: str
    model_name: str = "local-model"
    temperature: float = 0.0
    max_tokens: int = 512
    num_thread: int = 4
    
    @property
    def _llm_type(self) -> str:
        return "local"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs,
    ) -> str:
        """Call local Ollama API (with legacy fallback)."""
        try:
            response = requests.post(
                f"{self.model_url}/api/chat",
                json={
                    "model": self.model_name,
                    "messages": [
                        {"role": "system", "content": "You are a document analysis assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "stream": False,
                    "keep_alive": "30m",
                    "options": {
                        "temperature": self.temperature,
                        "num_predict": self.max_tokens,
                        "num_thread": self.num_thread,
                    }
                },
                timeout=MODEL_TIMEOUT_SECONDS
            )
            if response.ok:
                payload = response.json()
                return payload.get("message", {}).get("content", "")

            # Fallback for alternative local runners that expose OpenAI-compatible routes.
            response = requests.post(
                f"{self.model_url}/engines/llama.cpp/v1/chat/completions",
                json={
                    "model": self.model_name,
                    "messages": [
                        {"role": "system", "content": "You are a document analysis assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "stop": stop
                },
                timeout=MODEL_TIMEOUT_SECONDS
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"Error calling local model: {str(e)}. Using basic analysis.")
            return "Local model not available. Basic analysis applied."

# Embeddings are loaded lazily to avoid blocking service startup when model download is slow.
embeddings = None


def get_embeddings():
    global embeddings
    if os.getenv('DISABLE_EMBEDDINGS', 'false').lower() == 'true':
        logger.info('Embeddings disabled by DISABLE_EMBEDDINGS=true')
        return None

    if embeddings is not None:
        return embeddings

    try:
        logger.info(f"Loading embedding model lazily: {EMBEDDING_MODEL}...")
        embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        logger.info("✅ Embeddings loaded successfully!")
        return embeddings
    except Exception as e:
        logger.warning(f"Failed to load embeddings model: {e}. Continuing without vector store.")
        return None


def detect_document_language(text):
    sample = (text or '')[:4000].lower()
    if not sample.strip():
        return 'pt'

    portuguese_markers = [
        ' de ', ' para ', ' com ', ' documento ', ' análise ', ' resumo ',
        ' informação ', ' gestão ', ' não ', ' uma ', ' os ', ' as ',
    ]
    english_markers = [
        ' the ', ' and ', ' for ', ' with ', ' document ', ' analysis ',
        ' summary ', ' information ', ' management ', ' not ', ' this ',
    ]

    pt_score = sum(sample.count(marker) for marker in portuguese_markers)
    en_score = sum(sample.count(marker) for marker in english_markers)

    return 'en' if en_score > pt_score else 'pt'


def process_document(document_data):
    """
    Process document with RAG (text extraction, embeddings, LLM analysis)
    """
    document_id = document_data['documentId']
    logger.info(f"🤖 Processing document with RAG: {document_id}")
    
    try:
        download_url = document_data.get('downloadUrl')
        mime_type = document_data.get('mimeType', '')
        file_name = document_data.get('fileName', 'document')
        
        if not download_url:
            raise ValueError("Download URL not provided")
        
        # Download the document
        logger.info(f"📥 Downloading document from: {download_url}")
        response = requests.get(download_url, timeout=30)
        response.raise_for_status()
        
        # Determine file extension from MIME type, with fileName fallback
        mime_lower = mime_type.lower()
        file_ext = os.path.splitext(file_name)[1].lower() if file_name else ''
        logger.info(f"📋 MIME type: {mime_type}, fileName: {file_name}, file extension: {file_ext}")

        if 'pdf' in mime_lower or file_ext == '.pdf':
            extension = '.pdf'
        elif 'wordprocessingml' in mime_lower or 'msword' in mime_lower or file_ext in ('.docx', '.doc'):
            extension = '.docx'
        elif 'image' in mime_lower or file_ext in ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'):
            extension = '.' + mime_type.split('/')[-1].replace('jpeg', 'jpg') if 'image' in mime_lower else file_ext
        elif 'text' in mime_lower or file_ext == '.txt':
            extension = '.txt'
        else:
            extension = file_ext if file_ext else '.txt'
        
        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            temp_file.write(response.content)
            temp_path = temp_file.name
        
        try:
            # Load document based on type
            is_image = extension in ('.jpg', '.png', '.jpeg', '.webp', '.bmp', '.tiff')

            if is_image:
                logger.info("🖼️ Image file detected, running OCR")
                ocr_text = pytesseract.image_to_string(Image.open(temp_path), lang='por+eng')
                documents = [LCDocument(page_content=ocr_text, metadata={"source": temp_path})]
            elif extension == '.pdf':
                loader = PyPDFLoader(temp_path)
                documents = loader.load()
                # OCR fallback for scanned PDFs with no extractable text
                total_text = "".join(d.page_content.strip() for d in documents)
                if len(total_text) < 50:
                    logger.info("📷 PDF has no extractable text, running OCR fallback")
                    pages = convert_from_path(temp_path, dpi=300)
                    ocr_text = "\n\n".join(
                        pytesseract.image_to_string(page, lang='por+eng') for page in pages
                    )
                    documents = [LCDocument(page_content=ocr_text, metadata={"source": temp_path})]
            elif extension == '.docx':
                logger.info("📝 DOCX file detected")
                loader = Docx2txtLoader(temp_path)
                documents = loader.load()
            else:
                loader = TextLoader(temp_path, encoding='utf-8')
                documents = loader.load()

            # Split into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
            )
            chunks = text_splitter.split_documents(documents)

            logger.info(f"📄 Document split into {len(chunks)} chunks")
            
            # Extract full text
            full_text = " ".join([doc.page_content for doc in documents])
            text_preview = full_text[:500] + "..." if len(full_text) > 500 else full_text

            # Create/update org-level vector store with document_id metadata
            organization_id = document_data.get('organizationId', document_id)
            chroma_path = CHROMA_DIR / organization_id
            vector_store = None
            active_embedding_model = None
            embedding_model = get_embeddings()
            if embedding_model is not None and len(chunks) > 0:
                for chunk in chunks:
                    chunk.metadata["document_id"] = document_id

                if chroma_path.exists():
                    vector_store = Chroma(
                        persist_directory=str(chroma_path),
                        embedding_function=embedding_model,
                    )
                    vector_store.add_documents(chunks)
                    vector_store.persist()
                else:
                    vector_store = Chroma.from_documents(
                        documents=chunks,
                        embedding=embedding_model,
                        persist_directory=str(chroma_path),
                    )
                active_embedding_model = EMBEDDING_MODEL
            else:
                logger.warning("Skipping vector store creation because embeddings are unavailable")

            # Analysis with LLM (works with or without vector store)
            analysis_result = analyze_document_with_llm(vector_store, file_name, full_text, document_id)
            detected_language = analysis_result.get('language') or detect_document_language(full_text)
            
            result = {
                'success': True,
                'processedAt': datetime.now().isoformat(),
                'extractedData': {
                    'documentType': analysis_result.get('documentType', 'unknown'),
                    'summary': analysis_result.get('summary', text_preview),
                    'entities': analysis_result.get('entities', []),
                    'keywords': analysis_result.get('keywords', []),
                    'language': detected_language,
                    'chunksCount': len(chunks),
                    'textLength': len(full_text),
                    'confidence': analysis_result.get('confidence', 0.85),
                },
                'metadata': {
                    'processingTimeMs': 0,  # TODO: track time
                    'modelVersion': 'RAG-v1.0.0',
                    'aiEngine': 'langchain-chromadb' if vector_store is not None else 'llm-direct',
                    'chromaPath': str(chroma_path) if vector_store is not None else None,
                    'embeddingModel': active_embedding_model,
                }
            }
            
            logger.info(f"✅ Document processed successfully with RAG: {document_id}")
            return result
            
        finally:
            # Clean up temporary file
            os.unlink(temp_path)
        
    except Exception as e:
        logger.error(f"❌ Error processing document: {e}")
        logger.error(traceback.format_exc())
        
        return {
            'success': False,
            'error': str(e),
            'processedAt': datetime.now().isoformat()
        }


def analyze_document_with_llm(vector_store, filename, full_text, document_id=None):
    """
    Use LLM to analyze document and extract information.
    Falls back to direct prompting when vector store is unavailable.
    """
    try:
        llm = LocalLLM(
            model_url=MODEL_URL,
            model_name=MODEL_NAME,
            temperature=0.0
        )

        # Preferred path: retrieval over vector store.
        if vector_store is not None:
            lang = detect_document_language(full_text)
            lang_label = 'Portuguese' if lang == 'pt' else 'English'

            prompt_template = f"""Write a concise summary (max 200 words) of the following document.
Return ONLY the summary text, no headers, no bullet points, no labels, no markdown formatting.
IMPORTANT: The document is written in {lang_label}. You MUST write the summary in {lang_label}.

Document content: {{context}}

Summary in {lang_label}:"""

            prompt = PromptTemplate(
                template=prompt_template,
                input_variables=["context"]
            )

            search_kwargs = {"k": 5}
            if document_id:
                search_kwargs["filter"] = {"document_id": document_id}

            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=vector_store.as_retriever(search_kwargs=search_kwargs),
                return_source_documents=True,
                chain_type_kwargs={"prompt": prompt}
            )

            result = qa_chain({"query": f"Summarize document: {filename}"})
            summary = result.get('result', '').strip()
        else:
            # Fast path when embeddings are disabled: build a deterministic summary from document text.
            text = (full_text or '').replace('\n', ' ').strip()
            summary = text[:600]
            if len(text) > 600:
                summary += '...'

        return {
            'documentType': 'document',
            'summary': summary or 'Documento processado com sucesso.',
            'entities': [],
            'keywords': [],
            'language': detect_document_language(full_text),
            'confidence': 0.90
        }

    except Exception as e:
        logger.warning(f"LLM analysis failed: {e}. Using basic analysis.")
        return {
            'documentType': 'document',
            'summary': 'Document processed with embeddings. LLM model not available.',
            'entities': [],
            'keywords': [],
            'language': 'en',
            'confidence': 0.75
        }


def publish_result(channel, document_id, organization_id, user_email, result):
    """Publish processing result back to Document Service"""
    try:
        message = {
            'documentId': document_id,
            'organizationId': organization_id,
            'userEmail': user_email,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        
        channel.basic_publish(
            exchange=EXCHANGE,
            routing_key='document.processed',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # persistent
                content_type='application/json',
            )
        )
        logger.info(f"📤 Published processing result for document: {document_id}")
        
    except Exception as e:
        logger.error(f"❌ Error publishing result: {e}")
        raise


def callback(ch, method, properties, body):
    """Callback when message is received from RabbitMQ"""
    try:
        message = json.loads(body)
        logger.info(f"📥 Received document upload event: {message['documentId']}")
        
        # Process document
        result = process_document(message)
        
        # Publish result (including user email)
        publish_result(
            ch, 
            message['documentId'], 
            message['organizationId'],
            message.get('userEmail'),  # User email
            result
        )
        
        # ACK message
        ch.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(f"✅ Message acknowledged: {message['documentId']}")
        
    except Exception as e:
        logger.error(f"❌ Error processing message: {e}")
        logger.error(traceback.format_exc())
        # NACK and requeue on error
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main():
    """Start RabbitMQ consumer"""
    logger.info("🚀 Starting AI Service RabbitMQ Consumer...")
    
    # Retry connection
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Connect to RabbitMQ
            logger.info(f"Connecting to RabbitMQ: {RABBITMQ_URL}")
            params = pika.URLParameters(RABBITMQ_URL)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            
            # Declare exchange
            channel.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)
            logger.info(f"✅ Exchange declared: {EXCHANGE}")
            
            # Declare queue
            channel.queue_declare(queue=QUEUE, durable=True)
            logger.info(f"✅ Queue declared: {QUEUE}")
            
            # Bind queue to exchange
            channel.queue_bind(exchange=EXCHANGE, queue=QUEUE, routing_key=ROUTING_KEY)
            logger.info(f"✅ Queue bound to exchange with routing key: {ROUTING_KEY}")
            
            # QoS - process one message at a time
            channel.basic_qos(prefetch_count=1)
            
            # Consume messages
            channel.basic_consume(queue=QUEUE, on_message_callback=callback)
            
            logger.info(f"🎧 Listening for messages on queue: {QUEUE}")
            logger.info("Waiting for documents to process. To exit press CTRL+C")
            channel.start_consuming()
            
        except pika.exceptions.AMQPConnectionError as e:
            retry_count += 1
            logger.warning(f"Failed to connect to RabbitMQ. Retry {retry_count}/{max_retries}... Error: {e}")
            sleep(5)
        except KeyboardInterrupt:
            logger.info("👋 Shutting down gracefully...")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            logger.error(traceback.format_exc())
            sleep(5)
    
    if retry_count >= max_retries:
        logger.error("❌ Failed to connect to RabbitMQ after max retries")
        exit(1)


if __name__ == '__main__':
    main()
