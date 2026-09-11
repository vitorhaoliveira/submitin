/** Marca da conta (logo + nome) exibida no formulário público e no e-mail ao respondente. */

export const MAX_LOGO_BYTES = 1024 * 1024;
export const MAX_BRAND_NAME = 80;

const LOGO_TYPES = [
  { ext: "png", mime: "image/png", test: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "jpg", mime: "image/jpeg", test: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "webp", mime: "image/webp", test: (b: Buffer) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP" },
] as const;

/** Identifica o formato pelo conteúdo (não pela extensão). SVG não é aceito: pode conter script. */
export function detectLogoType(buffer: Buffer) {
  return LOGO_TYPES.find((t) => t.test(buffer)) ?? null;
}

export function logoMimeFromKey(key: string): string {
  const ext = key.split(".").pop();
  return LOGO_TYPES.find((t) => t.ext === ext)?.mime ?? "application/octet-stream";
}

/** URL pública do logo; o `v` muda a cada upload (chave nova), então pode ter cache longo. */
export function brandLogoUrl(userId: string, logoKey: string | null | undefined): string | null {
  if (!logoKey) return null;
  const version = logoKey.split("/").pop()?.split(".")[0] ?? "";
  return `/api/public/brand/${userId}?v=${version}`;
}
