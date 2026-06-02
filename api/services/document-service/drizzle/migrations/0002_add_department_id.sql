ALTER TABLE "documents" ADD COLUMN "department_id" uuid;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "uploaded_by_name" varchar(150) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ai_status" varchar(50) DEFAULT 'PENDING';
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ai_processed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ai_summary" text;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ai_entities" jsonb;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ai_keywords" jsonb;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ai_confidence" decimal(3,2);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "ai_error" text;