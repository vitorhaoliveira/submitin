import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Armazenamento de arquivos (templates .docx e documentos gerados).
 *
 * Produção: Supabase Storage (API REST, bucket privado).
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STORAGE_BUCKET (default "documents")
 * Desenvolvimento sem Supabase: disco local em apps/web/.storage/.
 *
 * Arquivos gerados são imutáveis: cada chave é escrita uma única vez.
 */

const bucket = () => process.env.STORAGE_BUCKET || "documents";
const supabaseUrl = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function useLocalDisk(): boolean {
  if (supabaseUrl() && serviceKey()) return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Storage não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }
  return true;
}

const localPath = (key: string) => join(process.cwd(), ".storage", bucket(), key);

function objectUrl(key: string): string {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl()}/storage/v1/object/${bucket()}/${path}`;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (useLocalDisk()) {
    await mkdir(dirname(localPath(key)), { recursive: true });
    await writeFile(localPath(key), body);
    return;
  }
  const res = await fetch(objectUrl(key), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey()}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) {
    throw new Error(`Falha ao salvar arquivo (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
}

export async function getObject(key: string): Promise<Buffer> {
  if (useLocalDisk()) return readFile(localPath(key));
  const res = await fetch(objectUrl(key), {
    headers: { Authorization: `Bearer ${serviceKey()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Falha ao ler arquivo (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME = "application/pdf";
