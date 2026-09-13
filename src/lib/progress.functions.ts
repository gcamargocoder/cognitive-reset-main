import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cria perfil, papel padrão e linha de progresso do usuário atual. */
export const bootstrapMe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("bootstrap_me");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Conclui um dia da trilha aplicando checklist obrigatório e bloqueio de 24h no servidor. */
export const completeDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        day: z.number().int().min(1).max(30),
        checklist: z.array(z.boolean()),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: progress, error } = await context.supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!progress) throw new Error("Progresso não encontrado. Recarregue a página.");

    if (progress.completed_days?.includes(data.day)) {
      return progress;
    }
    if (data.day !== progress.current_day) {
      throw new Error("Este dia ainda não está liberado.");
    }
    if (progress.unlock_at && new Date(progress.unlock_at).getTime() > Date.now()) {
      throw new Error("Ainda faltam algumas horas para liberar o próximo dia.");
    }
    if (data.checklist.length === 0 || data.checklist.some((done) => !done)) {
      throw new Error("Marque todos os itens do checklist antes de concluir o dia.");
    }

    const completed = Array.from(new Set([...(progress.completed_days ?? []), data.day])).sort(
      (a, b) => a - b,
    );
    const finished = data.day >= 30;
    const now = Date.now();

    const { data: row, error: updateError } = await context.supabase
      .from("user_progress")
      .update({
        completed_days: completed,
        current_day: finished ? 30 : data.day + 1,
        completed_at: new Date(now).toISOString(),
        unlock_at: finished ? null : new Date(now + DAY_MS).toISOString(),
      })
      .eq("user_id", context.userId)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);
    return row;
  });

/** Salva o estado dos checkboxes do dia atual. */
export const saveChecklistState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ day: z.number().int().min(1).max(30), state: z.array(z.boolean()) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: progress } = await context.supabase
      .from("user_progress")
      .select("checklist_state")
      .eq("user_id", context.userId)
      .maybeSingle();
    const current = (progress?.checklist_state ?? {}) as Record<string, boolean[]>;
    const { error } = await context.supabase
      .from("user_progress")
      .update({ checklist_state: { ...current, [String(data.day)]: data.state } })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Salva a assinatura do Contrato de Compromisso (Dia 1) dentro de checklist_state. */
export const saveContractStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        name: z.string().min(1),
        commitments: z.array(z.string()),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: progress } = await context.supabase
      .from("user_progress")
      .select("checklist_state")
      .eq("user_id", context.userId)
      .maybeSingle();
    const current = (progress?.checklist_state ?? {}) as Record<string, unknown>;
    const contractStatus = {
      name: data.name,
      commitments: data.commitments,
      signedAt: new Date().toISOString(),
    };
    const { error } = await context.supabase
      .from("user_progress")
      .update({ checklist_state: { ...current, contract: contractStatus } })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, contract: contractStatus };
  });

/** Reinicia a jornada: zera dias concluídos, checklist e assinatura do contrato. */
export const resetProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: row, error } = await context.supabase
      .from("user_progress")
      .update({
        current_day: 1,
        completed_days: [],
        checklist_state: {},
        completed_at: null,
        unlock_at: null,
      })
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
