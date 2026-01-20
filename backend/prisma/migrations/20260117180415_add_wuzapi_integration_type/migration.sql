-- CreateEnum
CREATE TYPE "InstagramPostType" AS ENUM ('POST', 'REEL', 'STORY');

-- AlterEnum
ALTER TYPE "IntegrationType" ADD VALUE 'WUZAPI';

-- CreateTable
CREATE TABLE "InstagramAccount" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "sessionData" JSONB,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "type" "InstagramPostType" NOT NULL DEFAULT 'POST',
    "mediaUrls" TEXT[],
    "caption" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'SCHEDULED',
    "error" TEXT,
    "instagramAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramFollower" (
    "id" TEXT NOT NULL,
    "instagramId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "welcomedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instagramAccountId" TEXT NOT NULL,

    CONSTRAINT "InstagramFollower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramAccount_username_key" ON "InstagramAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramFollower_instagramAccountId_instagramId_key" ON "InstagramFollower"("instagramAccountId", "instagramId");

-- AddForeignKey
ALTER TABLE "InstagramAccount" ADD CONSTRAINT "InstagramAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramFollower" ADD CONSTRAINT "InstagramFollower_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
