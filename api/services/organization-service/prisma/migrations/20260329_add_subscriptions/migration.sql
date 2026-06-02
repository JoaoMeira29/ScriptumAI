-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('free_trial');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('trialing', 'active', 'expired');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "plan" "subscription_plan" NOT NULL DEFAULT 'free_trial',
    "status" "subscription_status" NOT NULL DEFAULT 'trialing',
    "trial_start" TIMESTAMP NOT NULL,
    "trial_end" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_idx" ON "subscriptions"("organization_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
