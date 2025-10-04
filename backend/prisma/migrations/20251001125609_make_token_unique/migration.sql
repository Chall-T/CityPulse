/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Token` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Token" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '30 days');

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_key" ON "Token"("token");
