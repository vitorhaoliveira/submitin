-- Apresentação: modo conversacional (uma pergunta por vez) no formulário público
ALTER TABLE "form_settings" ADD COLUMN "conversational" BOOLEAN NOT NULL DEFAULT false;
