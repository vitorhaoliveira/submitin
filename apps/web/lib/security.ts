/**
 * Utilitários de segurança para sanitização e validação de inputs
 */

// ==========================================
// LIMITES DE USO
// ==========================================

// Limite máximo de caracteres por campo
export const MAX_FIELD_VALUE_LENGTH = 10000;

// Limite máximo de campos por submissão
export const MAX_FIELDS_PER_SUBMISSION = 50;

// Limite de formulários por usuário (conta gratuita)
export const MAX_FORMS_PER_USER = 10;

// Limite de respostas por formulário
export const MAX_RESPONSES_PER_FORM = 1000;

// Limite de campos por formulário
export const MAX_FIELDS_PER_FORM = 50;

/**
 * Remove caracteres potencialmente perigosos de uma string
 * Mantém o texto legível mas remove scripts e HTML
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    // Remove tags HTML/scripts
    .replace(/<[^>]*>/g, "")
    // Remove javascript: URLs
    .replace(/javascript:/gi, "")
    // Remove data: URLs (podem conter scripts)
    .replace(/data:/gi, "")
    // Remove event handlers
    .replace(/on\w+\s*=/gi, "")
    // Limita o tamanho
    .slice(0, MAX_FIELD_VALUE_LENGTH)
    // Remove caracteres de controle (exceto newlines e tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Sanitiza um objeto de valores de formulário
 */
export function sanitizeFormValues(
  values: Record<string, string>
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  let fieldCount = 0;
  for (const [key, value] of Object.entries(values)) {
    if (fieldCount >= MAX_FIELDS_PER_SUBMISSION) break;
    
    // Valida que a key é um ID válido (formato cuid/uuid)
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) continue;
    
    sanitized[key] = sanitizeString(String(value));
    fieldCount++;
  }
  
  return sanitized;
}

/**
 * Rate limiting simples em memória
 * Em produção, usar Redis ou similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minuto
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  // Limpa entradas antigas periodicamente
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: windowMs,
    };
  }
  
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }
  
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetIn: record.resetTime - now,
  };
}

/**
 * Obtém o IP do cliente de forma segura
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIP = forwarded.split(",")[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }
  
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida formato de URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

