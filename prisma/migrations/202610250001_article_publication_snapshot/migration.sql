ALTER TABLE "Post" ADD COLUMN "publishedSlug" TEXT;
ALTER TABLE "Post" ADD COLUMN "publishedRevisionId" TEXT;
CREATE UNIQUE INDEX "Post_publishedSlug_key" ON "Post"("publishedSlug");
CREATE UNIQUE INDEX "Post_id_publishedRevisionId_key" ON "Post"("id", "publishedRevisionId");
CREATE INDEX "Post_publishedRevisionId_idx" ON "Post"("publishedRevisionId");
CREATE UNIQUE INDEX "PostRevision_postId_id_key" ON "PostRevision"("postId", "id");
ALTER TABLE "Post" ADD CONSTRAINT "Post_publishedRevisionId_postId_fkey"
  FOREIGN KEY ("id", "publishedRevisionId") REFERENCES "PostRevision"("postId", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "Media" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Media" ADD COLUMN "articlePostId" TEXT;
ALTER TABLE "Media" ADD CONSTRAINT "Media_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media" ADD CONSTRAINT "Media_articlePostId_fkey" FOREIGN KEY ("articlePostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Media_articlePostId_idx" ON "Media"("articlePostId");
