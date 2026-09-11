-- Naturezas de variável, links personalizados, preview, marca da conta
ALTER TABLE "fields" ADD COLUMN "nature" TEXT NOT NULL DEFAULT 'pergunta',
ADD COLUMN "defaultValue" TEXT,
ADD COLUMN "helpText" TEXT;

ALTER TABLE "users" ADD COLUMN "brandName" TEXT,
ADD COLUMN "brandLogoKey" TEXT;

ALTER TABLE "documents" ADD COLUMN "emailRespondent" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "document_generations" ADD COLUMN "accessToken" TEXT;
UPDATE "document_generations" SET "accessToken" = md5(random()::text || id) WHERE "accessToken" IS NULL;
ALTER TABLE "document_generations" ALTER COLUMN "accessToken" SET NOT NULL;
CREATE UNIQUE INDEX "document_generations_accessToken_key" ON "document_generations"("accessToken");

CREATE TABLE "form_invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formId" TEXT NOT NULL,
    "responseId" TEXT,
    CONSTRAINT "form_invites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "form_invites_token_key" ON "form_invites"("token");
CREATE UNIQUE INDEX "form_invites_responseId_key" ON "form_invites"("responseId");
CREATE INDEX "form_invites_formId_createdAt_idx" ON "form_invites"("formId", "createdAt");
ALTER TABLE "form_invites" ADD CONSTRAINT "form_invites_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "form_invites" ADD CONSTRAINT "form_invites_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "document_previews" (
    "id" TEXT NOT NULL,
    "dataHash" TEXT NOT NULL,
    "pdfKey" TEXT NOT NULL,
    "docxKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    CONSTRAINT "document_previews_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "document_previews_documentId_createdAt_idx" ON "document_previews"("documentId", "createdAt");
ALTER TABLE "document_previews" ADD CONSTRAINT "document_previews_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_previews" ADD CONSTRAINT "document_previews_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
