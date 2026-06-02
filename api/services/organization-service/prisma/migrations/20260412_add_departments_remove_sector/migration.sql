-- AlterTable: remove sector column
ALTER TABLE "organizations" DROP COLUMN "sector";

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departments_organization_id_idx" ON "departments"("organization_id");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
