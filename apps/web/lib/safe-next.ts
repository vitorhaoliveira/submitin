/** Aceita só caminhos internos ("/dashboard/...") como destino pós-login/cadastro. */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
