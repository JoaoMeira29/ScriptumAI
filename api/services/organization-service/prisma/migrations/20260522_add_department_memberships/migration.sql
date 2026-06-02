-- CreateTable
CREATE TABLE "department_memberships" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "department_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_memberships_department_id_user_id_key" ON "department_memberships"("department_id", "user_id");

-- CreateIndex
CREATE INDEX "department_memberships_user_id_idx" ON "department_memberships"("user_id");

-- AddForeignKey
ALTER TABLE "department_memberships" ADD CONSTRAINT "department_memberships_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
