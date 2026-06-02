CREATE TABLE IF NOT EXISTS "global_chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" varchar(20) NOT NULL,
  "content" text NOT NULL,
  "source_documents" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "global_chat_org_user_idx"
  ON "global_chat_messages" ("organization_id", "user_id");
