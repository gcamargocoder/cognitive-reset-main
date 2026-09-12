/**
 * Guard-rails para upload de arquivos. Nenhuma tela do app envia arquivos hoje —
 * isto existe pronto para quando essa funcionalidade for adicionada (ex.: foto de perfil).
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_UPLOAD_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function validateUploadFile(file: File): { ok: true } | { ok: false; error: string } {
  if (
    !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])
  ) {
    return { ok: false, error: "Formato de arquivo não permitido. Envie PNG, JPEG ou WebP." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Arquivo muito grande. O limite é 5MB." };
  }
  return { ok: true };
}
