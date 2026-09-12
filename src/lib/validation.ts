import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Digite seu e-mail.")
  .max(254, "E-mail muito longo.")
  .email("Digite um e-mail válido.");

export const passwordSchema = z
  .string()
  .min(6, "A senha precisa ter pelo menos 6 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Digite sua senha."),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Diga como quer ser chamado.").max(120, "Nome muito longo."),
  email: emailSchema,
  password: passwordSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

/** Limite de tamanho para textos livres salvos no diário (evita payloads abusivos). */
export const JOURNAL_TEXT_MAX_LENGTH = 4000;

export const journalTextSchema = z
  .string()
  .trim()
  .min(1, "Escreva algo antes de salvar.")
  .max(JOURNAL_TEXT_MAX_LENGTH, `Texto muito longo (máx. ${JOURNAL_TEXT_MAX_LENGTH} caracteres).`);

/** Extrai a primeira mensagem de erro de um resultado zod inválido. */
export function firstIssueMessage(result: { error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message ?? "Dados inválidos.";
}
