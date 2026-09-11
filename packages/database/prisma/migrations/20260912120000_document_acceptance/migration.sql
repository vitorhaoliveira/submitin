-- AlterTable
ALTER TABLE "documents" ADD COLUMN "requireAcceptance" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "document_generations" ADD COLUMN "acceptedAt" TIMESTAMP(3),
ADD COLUMN "acceptanceIp" TEXT,
ADD COLUMN "acceptanceUserAgent" TEXT,
ADD COLUMN "acceptanceStatement" TEXT,
ADD COLUMN "pdfSha256" TEXT;
