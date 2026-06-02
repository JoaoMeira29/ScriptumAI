import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  bigint,
  index,
  jsonb,
  decimal,
} from 'drizzle-orm/pg-core';

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    uploadedBy: uuid('uploaded_by').notNull(),
    uploadedByName: varchar('uploaded_by_name', { length: 150 }).notNull(),

    // File metadata
    fileName: varchar('file_name', { length: 255 }).notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),

    departmentId: uuid('department_id'),

    // MinIO
    bucketName: varchar('bucket_name', { length: 100 }).notNull(),
    objectKey: varchar('object_key', { length: 500 }).notNull(),
    description: text('description'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    //  AI Processing Results
    aiStatus: varchar('ai_status', { length: 50 }).default('PENDING'),
    aiProcessedAt: timestamp('ai_processed_at'),
    aiSummary: text('ai_summary'),
    aiEntities: jsonb('ai_entities'),
    aiKeywords: jsonb('ai_keywords'),
    aiConfidence: decimal('ai_confidence', { precision: 3, scale: 2 }),
    aiError: text('ai_error'),
  },
  (table) => [index('org_idx').on(table.organizationId)],
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('chat_messages_org_user_idx').on(table.organizationId, table.userId),
    index('chat_messages_document_idx').on(table.documentId),
  ],
);

export const globalChatMessages = pgTable(
  'global_chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    content: text('content').notNull(),
    sourceDocuments: jsonb('source_documents'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('global_chat_org_user_idx').on(table.organizationId, table.userId),
  ],
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type GlobalChatMessage = typeof globalChatMessages.$inferSelect;
export type NewGlobalChatMessage = typeof globalChatMessages.$inferInsert;
