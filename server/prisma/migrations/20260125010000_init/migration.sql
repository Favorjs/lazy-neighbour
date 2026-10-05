-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LAZY', 'RUNNER');

-- CreateEnum
CREATE TYPE "ErrandCategory" AS ENUM ('FOOD', 'STORE', 'HOME', 'QUICK');

-- CreateEnum
CREATE TYPE "ErrandStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'RELEASED', 'DISPUTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "rating_score" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    "karma_points" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "current_role" "Role" NOT NULL DEFAULT 'LAZY',
    "stripe_account_id" TEXT,
    "stripe_customer_id" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "push_token" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "errands" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ErrandCategory" NOT NULL,
    "bounty_amount" DECIMAL(10,2) NOT NULL,
    "service_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "ErrandStatus" NOT NULL DEFAULT 'PENDING',
    "location_lat" DECIMAL(10,7) NOT NULL,
    "location_lng" DECIMAL(10,7) NOT NULL,
    "address" TEXT,
    "proof_photo_url" TEXT,
    "requester_id" UUID NOT NULL,
    "runner_id" UUID,
    "accepted_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "released_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "errands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "errand_id" UUID NOT NULL,
    "stripe_payment_intent" TEXT,
    "stripe_transfer_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "service_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "runner_payout" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "errand_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "errand_id" UUID NOT NULL,
    "rater_id" UUID NOT NULL,
    "rated_id" UUID NOT NULL,
    "score" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "errands_status_created_at_idx" ON "errands"("status", "created_at");

-- CreateIndex
CREATE INDEX "errands_requester_id_idx" ON "errands"("requester_id");

-- CreateIndex
CREATE INDEX "errands_runner_id_idx" ON "errands"("runner_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_errand_id_key" ON "transactions"("errand_id");

-- CreateIndex
CREATE INDEX "messages_errand_id_created_at_idx" ON "messages"("errand_id", "created_at");

-- AddForeignKey
ALTER TABLE "errands" ADD CONSTRAINT "errands_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "errands" ADD CONSTRAINT "errands_runner_id_fkey" FOREIGN KEY ("runner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_errand_id_fkey" FOREIGN KEY ("errand_id") REFERENCES "errands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_errand_id_fkey" FOREIGN KEY ("errand_id") REFERENCES "errands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_errand_id_fkey" FOREIGN KEY ("errand_id") REFERENCES "errands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rated_id_fkey" FOREIGN KEY ("rated_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

