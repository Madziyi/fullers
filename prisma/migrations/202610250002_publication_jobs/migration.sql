CREATE TYPE "PublicationJobStatus" AS ENUM ('PENDING', 'RETRY', 'PUBLISHED', 'NEEDS_REVIEW', 'FAILED', 'CANCELLED');

CREATE TABLE "PublicationJob" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "scheduledById" TEXT NOT NULL,
    "scheduledVersion" INTEGER NOT NULL,
    "runAt" TIMESTAMPTZ(3) NOT NULL,
    "nextAttemptAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "PublicationJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "finishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "PublicationJob_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PublicationJob_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 5)
);

CREATE INDEX "PublicationJob_status_nextAttemptAt_runAt_idx" ON "PublicationJob"("status", "nextAttemptAt", "runAt");
CREATE INDEX "PublicationJob_postId_status_createdAt_idx" ON "PublicationJob"("postId", "status", "createdAt");

ALTER TABLE "PublicationJob" ADD CONSTRAINT "PublicationJob_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PublicationJob" ADD CONSTRAINT "PublicationJob_scheduledById_fkey"
  FOREIGN KEY ("scheduledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
