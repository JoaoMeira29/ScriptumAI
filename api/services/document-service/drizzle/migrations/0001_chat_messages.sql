CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "chat_messages_org_user_idx" ON "chat_messages" USING btree ("organization_id", "user_id");
--> statement-breakpoint
CREATE INDEX "chat_messages_document_idx" ON "chat_messages" USING btree ("document_id");