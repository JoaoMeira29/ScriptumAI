import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from 'src/database/drizzle.provider';
import { MinioService } from 'src/minio/minio.service';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { DocumentResponse } from './dto/document-response.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AuthenticatedUser } from 'src/common/types/request';
import { v4 as uuidv4 } from 'uuid';
import {
  chatMessages,
  documents,
  globalChatMessages,
  NewChatMessage,
  NewDocument,
  NewGlobalChatMessage,
  Document,
} from 'src/database/schema';
import { UploadDocumentParams } from './interfaces/document.interface';
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm';

type PlanInfo = {
  planId: string;
  status: string | null;
  limit: number;
  trialStartDate: string | null;
  daysRemaining: number | null;
};

type ChatResponse = {
  answer: string;
};

type GlobalChatAiResponse = {
  answer: string;
  sourceDocuments: Array<{
    documentId: string;
    documentName: string;
    relevanceScore: number;
  }>;
};

@Injectable()
export class DocumentService implements OnModuleInit {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly minioService: MinioService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    // Escutar eventos de documentos processados pelo AI Service
    await this.rabbitMQService.consume(
      'document-service.processed',
      'document.processed',
      this.handleDocumentProcessed.bind(this),
    );
  }

  async uploadDocument(
    user: AuthenticatedUser,
    params: UploadDocumentParams,
  ): Promise<DocumentResponse> {
    const { file, fileSize, description, departmentId, name } = params;

    const fileId = uuidv4();
    const fileExtension = file.filename.split('.').pop() || '';

    const now = new Date();
    const objectKey = `${user.organizationId}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${fileId}.${fileExtension}`;

    this.logger.log(`Uploading file: ${file.filename} -> ${objectKey}`);

    // Upload to MinIO
    const uploadResult = await this.minioService.uploadFile({
      objectKey: objectKey,
      stream: file.file,
      size: fileSize,
      mimeType: file.mimetype,
    });

    try {
      // Save metadata to PostgreSQL
      const newDocument: NewDocument = {
        id: fileId,
        organizationId: user.organizationId,
        uploadedBy: user.userId,
        uploadedByName: user.displayName,
        fileName: `${fileId}.${fileExtension}`,
        originalName: name || file.filename,
        mimeType: file.mimetype,
        size: fileSize,
        bucketName: uploadResult.bucket,
        objectKey: uploadResult.key,
        description: description || null,
        departmentId: departmentId || null,
      };

      const [insertedDocument] = await this.db
        .insert(documents)
        .values(newDocument)
        .returning();

      this.logger.log(`Document saved: ${insertedDocument.id}`);

      // 🆕 Publicar evento para AI Service processar
      try {
        const downloadUrl = await this.minioService.getPresignedUrl({
          objectKey: insertedDocument.objectKey,
          expirySeconds: 3600, // 1 hora
        });

        await this.rabbitMQService.publish('document.uploaded', {
          documentId: insertedDocument.id,
          organizationId: insertedDocument.organizationId,
          uploadedBy: insertedDocument.uploadedBy,
          userEmail: user.email,
          fileName: file.filename,
          mimeType: insertedDocument.mimeType,
          size: insertedDocument.size,
          downloadUrl: downloadUrl,
          uploadedAt: insertedDocument.createdAt.toISOString(),
        });

        this.logger.log(
          `📤 Document upload event published: ${insertedDocument.id}`,
        );
      } catch (error) {
        this.logger.error('Failed to publish document.uploaded event', error);
        // Não falhar o upload se a publicação falhar
      }

      return this.toResponse(insertedDocument);
    } catch (dbError) {
      this.logger.error(
        'Error saving to DB. Deleting uploaded file from MinIO.',
        dbError,
      );

      await this.minioService
        .deleteFile(uploadResult.key)
        .catch((error) =>
          this.logger.error('Critial Error: File cannot be deleted', error),
        );

      throw dbError;
    }
  }

  /**
   * List all documents for an organization.
   * Admins/staff see everything; regular users only see docs
   * from departments they belong to, plus their own uploads.
   */
  async listDocuments(
    user: AuthenticatedUser,
    options: { page?: number; limit?: number; search?: string } = {},
  ) {
    const { page = 1, limit = 20, search } = options;
    const isPrivileged = user.role === 'admin' || user.role === 'staff';

    const conditions: ReturnType<typeof eq>[] = [];

    if (isPrivileged) {
      conditions.push(eq(documents.organizationId, user.organizationId));
    } else {
      const userDeptIds = await this.getUserDepartmentIds(
        user.organizationId,
        user.userId,
      );

      if (userDeptIds.length > 0) {
        conditions.push(
          eq(documents.organizationId, user.organizationId),
          sql`(${documents.departmentId} IN (${sql.join(
            userDeptIds.map((id) => sql`${id}`),
            sql`, `,
          )}) OR ${documents.uploadedBy} = ${user.userId})`,
        );
      } else {
        conditions.push(
          eq(documents.organizationId, user.organizationId),
          eq(documents.uploadedBy, user.userId),
        );
      }
    }

    if (search?.trim()) {
      conditions.push(ilike(documents.originalName, `%${search.trim()}%`));
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(documents)
      .where(where);
    const total = totalResult?.count ?? 0;

    const offset = (page - 1) * limit;
    const docs = await this.db
      .select()
      .from(documents)
      .where(where)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    const data = await Promise.all(docs.map((doc) => this.toResponse(doc)));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single document by ID
   */
  async getDocument(
    user: AuthenticatedUser,
    documentId: string,
  ): Promise<DocumentResponse> {
    const doc = await this.findDocument(user, documentId);

    return this.toResponse(doc, true);
  }

  async getChatUsage(user: AuthenticatedUser, documentId?: string) {
    const planInfo = await this.resolvePlanInfo(user.organizationId);
    const messagesSent = await this.countMessagesSent(user, documentId);
    const remainingMessages = Math.max(planInfo.limit - messagesSent, 0);

    return {
      currentPlan: planInfo.planId,
      planStatus: planInfo.status,
      messagesSent,
      limit: planInfo.limit,
      remainingMessages,
      trialStartDate: planInfo.trialStartDate,
      daysRemaining: planInfo.daysRemaining,
    };
  }

  async chatWithDocument(
    user: AuthenticatedUser,
    documentId: string,
    message: string,
  ): Promise<
    { documentId: string; answer: string } & Awaited<
      ReturnType<DocumentService['getChatUsage']>
    >
  > {
    if (!message?.trim()) {
      throw new HttpException(
        { error: 'invalid_message', message: 'Message is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const doc = await this.findDocument(user, documentId);
    const planInfo = await this.resolvePlanInfo(user.organizationId);
    const messagesSent = await this.countMessagesSent(user, documentId);

    if (messagesSent >= planInfo.limit) {
      throw new HttpException(
        {
          error: 'limit_reached',
          message: 'Upgrade to Starter to unlock more messages.',
          current_plan: planInfo.planId,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const aiResponse = await this.sendChatToAiService(
      user.organizationId,
      documentId,
      message,
    );

    const userMessage: NewChatMessage = {
      documentId: doc.id,
      organizationId: user.organizationId,
      userId: user.userId,
      role: 'user',
      content: message.trim(),
    };

    const assistantMessage: NewChatMessage = {
      documentId: doc.id,
      organizationId: user.organizationId,
      userId: user.userId,
      role: 'assistant',
      content: aiResponse.answer,
    };

    await this.db.insert(chatMessages).values([userMessage, assistantMessage]);

    const updatedUsage = messagesSent + 1;

    return {
      documentId,
      answer: aiResponse.answer,
      currentPlan: planInfo.planId,
      planStatus: planInfo.status,
      messagesSent: updatedUsage,
      limit: planInfo.limit,
      remainingMessages: Math.max(planInfo.limit - updatedUsage, 0),
      trialStartDate: planInfo.trialStartDate,
      daysRemaining: planInfo.daysRemaining,
    };
  }

  async getChatMessageCount(user: AuthenticatedUser): Promise<number> {
    return this.countMessagesSent(user);
  }

  async globalChat(user: AuthenticatedUser, message: string) {
    if (!message?.trim()) {
      throw new HttpException(
        { error: 'invalid_message', message: 'Message is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const planInfo = await this.resolvePlanInfo(user.organizationId);
    const messagesSent = await this.countGlobalMessagesSent(user);

    if (messagesSent >= planInfo.limit) {
      throw new HttpException(
        {
          error: 'limit_reached',
          message: 'Upgrade to Starter to unlock more messages.',
          current_plan: planInfo.planId,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const { data: accessibleDocs } = await this.listDocuments(user, { limit: 1000 });
    const processedDocs = accessibleDocs.filter(
      (d) => d.aiStatus === 'COMPLETED',
    );

    if (processedDocs.length === 0) {
      throw new HttpException(
        {
          error: 'no_documents',
          message: 'No processed documents available for chat.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const documentIds = processedDocs.map((d) => d.id);
    const documentNames: Record<string, string> = {};
    for (const d of processedDocs) {
      documentNames[d.id] = d.originalName;
    }

    const aiResponse = await this.sendGlobalChatToAiService(
      user.organizationId,
      message,
      documentIds,
      documentNames,
    );

    const userMsg: NewGlobalChatMessage = {
      organizationId: user.organizationId,
      userId: user.userId,
      role: 'user',
      content: message.trim(),
    };

    const assistantMsg: NewGlobalChatMessage = {
      organizationId: user.organizationId,
      userId: user.userId,
      role: 'assistant',
      content: aiResponse.answer,
      sourceDocuments: aiResponse.sourceDocuments,
    };

    await this.db
      .insert(globalChatMessages)
      .values([userMsg, assistantMsg]);

    const updatedUsage = messagesSent + 1;

    return {
      answer: aiResponse.answer,
      sourceDocuments: aiResponse.sourceDocuments,
      currentPlan: planInfo.planId,
      planStatus: planInfo.status,
      messagesSent: updatedUsage,
      limit: planInfo.limit,
      remainingMessages: Math.max(planInfo.limit - updatedUsage, 0),
    };
  }

  async getDocumentChatHistory(user: AuthenticatedUser, documentId: string) {
    await this.findDocument(user, documentId);

    const messages = await this.db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.documentId, documentId),
          eq(chatMessages.organizationId, user.organizationId),
          eq(chatMessages.userId, user.userId),
        ),
      )
      .orderBy(chatMessages.createdAt);

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async getGlobalChatHistory(user: AuthenticatedUser) {
    const messages = await this.db
      .select()
      .from(globalChatMessages)
      .where(
        and(
          eq(globalChatMessages.organizationId, user.organizationId),
          eq(globalChatMessages.userId, user.userId),
        ),
      )
      .orderBy(globalChatMessages.createdAt);

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sourceDocuments: m.sourceDocuments ?? null,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async getGlobalChatUsage(user: AuthenticatedUser) {
    const planInfo = await this.resolvePlanInfo(user.organizationId);
    const messagesSent = await this.countGlobalMessagesSent(user);
    const remainingMessages = Math.max(planInfo.limit - messagesSent, 0);

    return {
      currentPlan: planInfo.planId,
      planStatus: planInfo.status,
      messagesSent,
      limit: planInfo.limit,
      remainingMessages,
    };
  }

  private async countGlobalMessagesSent(
    user: AuthenticatedUser,
  ): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(globalChatMessages)
      .where(
        and(
          eq(globalChatMessages.organizationId, user.organizationId),
          eq(globalChatMessages.userId, user.userId),
          eq(globalChatMessages.role, 'user'),
        ),
      );

    return result?.count ?? 0;
  }

  private async sendGlobalChatToAiService(
    organizationId: string,
    message: string,
    documentIds: string[],
    documentNames: Record<string, string>,
  ): Promise<GlobalChatAiResponse> {
    const baseUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 270_000);

    const response = await fetch(`${baseUrl}/documents/global-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        organization_id: organizationId,
        document_ids: documentIds,
        document_names: documentNames,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        payload?.detail ||
        payload?.message ||
        `AI global chat failed with status ${response.status}`;
      throw new HttpException(errorMessage, response.status);
    }

    return {
      answer: payload?.answer || '',
      sourceDocuments: payload?.sourceDocuments || [],
    };
  }

  private async findDocument(user: AuthenticatedUser, documentId: string) {
    const [doc] = await this.db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.organizationId, user.organizationId),
        ),
      );

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    return doc;
  }

  /**
   * Delete a document
   */
  async updateDocument(
    user: AuthenticatedUser,
    documentId: string,
    dto: UpdateDocumentDto,
  ): Promise<DocumentResponse> {
    const [doc] = await this.db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.organizationId, user.organizationId),
        ),
      );

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    const updateData: Partial<typeof documents.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.originalName !== undefined)
      updateData.originalName = dto.originalName;
    if (dto.description !== undefined) updateData.description = dto.description;
    if ('departmentId' in dto)
      updateData.departmentId = dto.departmentId ?? undefined;

    const [updated] = await this.db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, documentId))
      .returning();

    this.logger.log(`Document updated: ${documentId}`);
    return this.toResponse(updated);
  }

  async deleteDocument(
    user: AuthenticatedUser,
    documentId: string,
  ): Promise<void> {
    const [doc] = await this.db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.organizationId, user.organizationId),
        ),
      );

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // Delete from MinIO
    await this.minioService.deleteFile(doc.objectKey);

    // Delete ChromaDB embeddings via AI service
    try {
      const baseUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);

      const resp = await fetch(`${baseUrl}/documents/${documentId}/embeddings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          organization_id: user.organizationId,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (resp.ok) {
        const result = await resp.json();
        this.logger.log(`ChromaDB embeddings deleted: ${result.deleted} chunks`);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete ChromaDB embeddings for ${documentId}: ${err.message}`);
    }

    // Delete chat messages linked to this document
    await this.db.delete(chatMessages).where(eq(chatMessages.documentId, documentId));

    // Delete from database
    await this.db.delete(documents).where(eq(documents.id, documentId));

    this.logger.log(`Document deleted: ${documentId}`);
  }

  /**
   * Handler para processar resultados do AI Service
   */
  private async handleDocumentProcessed(message: any) {
    try {
      this.logger.log(
        `🤖 AI Processing completed for document: ${message.documentId}`,
      );

      const [document] = await this.db
        .select({
          id: documents.id,
          organizationId: documents.organizationId,
          uploadedBy: documents.uploadedBy,
          originalName: documents.originalName,
        })
        .from(documents)
        .where(eq(documents.id, message.documentId));

      if (!document) {
        this.logger.warn(`Document not found: ${message.documentId}`);
        return;
      }

      const result = message.result;

      if (result.success) {
        this.logger.log(`✅ AI Processing successful`);
        this.logger.log(
          `Extracted data: ${JSON.stringify(result.extractedData, null, 2)}`,
        );

        await this.db
          .update(documents)
          .set({
            aiStatus: 'COMPLETED',
            aiProcessedAt: new Date(),
            aiSummary: result.extractedData?.summary ?? null,
            aiEntities: result.extractedData?.entities ?? null,
            aiKeywords: result.extractedData?.keywords ?? null,
            aiConfidence: result.extractedData?.confidence ?? null,
            aiError: null,
            updatedAt: new Date(),
          })
          .where(eq(documents.id, message.documentId));

        await this.rabbitMQService.publish('document.ai.completed', {
          documentId: document.id,
          organizationId: document.organizationId,
          uploadedBy: document.uploadedBy,
          userEmail: message.userEmail,
          language: result.extractedData?.language ?? 'pt',
          fileName: document.originalName,
          summary:
            result.extractedData?.summary ?? 'Documento processado com sucesso',
          processedAt: new Date().toISOString(),
        });

        this.logger.log(
          `📤 Notification event published: ${message.documentId}`,
        );
      } else {
        this.logger.error(`❌ AI Processing failed: ${result.error}`);

        await this.db
          .update(documents)
          .set({
            aiStatus: 'FAILED',
            aiError: result.error ?? 'Unknown AI processing error',
            updatedAt: new Date(),
          })
          .where(eq(documents.id, message.documentId));
      }
    } catch (error) {
      this.logger.error('Error handling document processed event', error);
      throw error;
    }
  }

  private async getUserDepartmentIds(
    organizationId: string,
    userId: string,
  ): Promise<string[]> {
    const baseUrl =
      process.env.ORG_SERVICE_URL || 'http://organization-service:3000/api';

    try {
      const response = await fetch(
        `${baseUrl}/organizations/${organizationId}/departments/by-user/${userId}`,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch user departments: status ${response.status}`,
        );
        return [];
      }

      const departments: Array<{ id: string }> = await response.json();
      return departments.map((d) => d.id);
    } catch (error) {
      this.logger.warn(
        `Unable to fetch user departments: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  private async countMessagesSent(
    user: AuthenticatedUser,
    documentId?: string,
  ): Promise<number> {
    const conditions = [
      eq(chatMessages.organizationId, user.organizationId),
      eq(chatMessages.userId, user.userId),
      eq(chatMessages.role, 'user'),
    ];

    if (documentId) {
      conditions.push(eq(chatMessages.documentId, documentId));
    }

    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(and(...conditions));

    return result?.count ?? 0;
  }

  private async resolvePlanInfo(organizationId: string): Promise<PlanInfo> {
    const baseUrl =
      process.env.ORG_SERVICE_URL || 'http://organization-service:3000/api';

    try {
      const response = await fetch(
        `${baseUrl}/organizations/${organizationId}/subscription-status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Plan lookup failed with status ${response.status}`);
      }

      const payload = await response.json();
      const subscription = payload?.subscription;
      const planId = this.normalizePlanId(
        subscription?.plan,
        subscription?.status,
      );

      return {
        planId,
        status: subscription?.status ?? null,
        limit: this.getPlanLimit(planId),
        trialStartDate: subscription?.trial_start
          ? new Date(subscription.trial_start).toISOString()
          : null,
        daysRemaining:
          typeof subscription?.days_remaining === 'number'
            ? subscription.days_remaining
            : null,
      };
    } catch (error) {
      this.logger.warn(
        `Unable to resolve plan info for organization ${organizationId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        planId: 'free-trial',
        status: null,
        limit: 3,
        trialStartDate: null,
        daysRemaining: null,
      };
    }
  }

  private normalizePlanId(plan?: string, status?: string | null): string {
    if (!plan) {
      return 'free-trial';
    }

    const normalized = plan.toLowerCase().replace(/_/g, '-');

    if (normalized === 'free-trial' || normalized === 'starter') {
      return normalized;
    }

    if (status === 'trialing') {
      return 'free-trial';
    }

    return normalized;
  }

  private getPlanLimit(planId: string): number {
    return planId === 'starter' ? 10 : 3;
  }

  private async sendChatToAiService(
    organizationId: string,
    documentId: string,
    message: string,
  ): Promise<ChatResponse> {
    const baseUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 270_000);

    const response = await fetch(`${baseUrl}/documents/${documentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, organization_id: organizationId }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        payload?.detail ||
        payload?.message ||
        `AI chat failed with status ${response.status}`;
      throw new HttpException(errorMessage, response.status);
    }

    return {
      answer: payload?.answer || payload?.response || payload?.message || '',
    };
  }

  /**
   * Convert database entity to response DTO
   */
  private async toResponse(
    doc: Document,
    includeDownloadUrl = false,
  ): Promise<DocumentResponse> {
    const response: DocumentResponse = {
      id: doc.id,
      organizationId: doc.organizationId,
      uploadedBy: doc.uploadedBy,
      uploadedByName: doc.uploadedByName,
      departmentId: doc.departmentId ?? null,
      fileName: doc.fileName,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      description: doc.description,
      createdAt: doc.createdAt.toISOString(),
      aiStatus: doc.aiStatus ?? null,
      aiProcessedAt: doc.aiProcessedAt?.toISOString(),
      aiSummary: doc.aiSummary ?? null,
      aiEntities: doc.aiEntities ?? null,
      aiKeywords: doc.aiKeywords ?? null,
      aiConfidence:
        doc.aiConfidence !== null && doc.aiConfidence !== undefined
          ? Number(doc.aiConfidence)
          : null,
      aiError: doc.aiError ?? null,
    };

    if (includeDownloadUrl) {
      response.downloadUrl = await this.minioService.getPresignedUrl({
        objectKey: doc.objectKey,
        public: true,
      });
    }

    return response;
  }
}
