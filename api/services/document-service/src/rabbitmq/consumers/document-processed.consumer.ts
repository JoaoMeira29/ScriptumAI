import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { DRIZZLE, type DrizzleDB } from '../../database/drizzle.provider';
import { documents } from '../../database/schema';
import { eq } from 'drizzle-orm';

interface DocumentProcessedPayload {
  documentId: string;
  organizationId: string;
  status: 'COMPLETED' | 'FAILED';
  summary?: string;
  entities?: any[];
  keywords?: string[];
  confidence?: number;
  language?: string;
  error?: string;
  processedAt: string;
  uploadedBy?: string;
  fileName?: string;
}

@Injectable()
export class DocumentProcessedConsumer implements OnModuleInit {
  private readonly logger = new Logger(DocumentProcessedConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async onModuleInit() {
    // Aguardar conexão RabbitMQ estar pronta
    setTimeout(() => {
      this.startConsumer();
    }, 2000);
  }

  private async startConsumer() {
    try {
      await this.rabbitMQService.consume(
        'document-service.document.processed',
        'document.processed',
        this.handleDocumentProcessed.bind(this),
      );

      this.logger.log('✅ Started consuming document.processed events');
    } catch (error) {
      this.logger.error('Failed to start consumer', error);
      // Retry após 5 segundos
      setTimeout(() => this.startConsumer(), 5000);
    }
  }

  async handleDocumentProcessed(payload: DocumentProcessedPayload) {
    try {
      this.logger.log(
        `📥 Processing result for document: ${payload.documentId}`,
      );

      // Buscar documento
      const [document] = await this.db
        .select()
        .from(documents)
        .where(eq(documents.id, payload.documentId));

      if (!document) {
        this.logger.warn(`Document not found: ${payload.documentId}`);
        return;
      }

      // Atualizar documento com resultado do AI
      await this.db
        .update(documents)
        .set({
          aiStatus: payload.status,
          aiProcessedAt: payload.processedAt
            ? new Date(payload.processedAt)
            : new Date(),
          aiSummary: payload.summary || null,
          aiEntities: payload.entities || null,
          aiKeywords: payload.keywords || null,
          aiConfidence: payload.confidence?.toString(),
          aiError: payload.error || null,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, payload.documentId));

      this.logger.log(
        `✅ Document updated with AI results: ${payload.documentId}`,
      );

      // 📧 Publicar evento para Notification Service
      if (payload.status === 'COMPLETED') {
        await this.rabbitMQService.publish('document.ai.completed', {
          documentId: payload.documentId,
          organizationId: document.organizationId,
          uploadedBy: document.uploadedBy,
          language: payload.language ?? 'pt',
          fileName: document.originalName,
          summary: payload.summary || 'Documento processado com sucesso',
          processedAt: new Date().toISOString(),
        });

        this.logger.log(
          `📤 Notification event published: ${payload.documentId}`,
        );
      }
    } catch (error) {
      this.logger.error('Error processing document.processed event', error);
      throw error;
    }
  }
}
