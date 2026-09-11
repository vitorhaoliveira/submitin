-- Campos preenchidos pela empresa e links personalizados por cliente
ALTER TABLE "fields" ADD COLUMN "filledBy" TEXT NOT NULL DEFAULT 'client',
ADD COLUMN "defaultValue" TEXT;

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
