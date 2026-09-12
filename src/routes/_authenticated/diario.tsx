import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { JOURNAL_TEXT_MAX_LENGTH, firstIssueMessage, journalTextSchema } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/diario")({
  component: DiarioPage,
});

const KIND_LABELS: Record<string, string> = {
  livre: "Anotação livre",
  grounding: "Ancoragem 5-4-3-2-1",
  braindump: "Descarga mental",
  journal: "Diário guiado",
  tribunal: "Tribunal do pensamento",
  steps: "Pequenos passos",
  surf: "Surfar a onda",
  contract: "Contrato de compromisso",
};

function renderContent(content: unknown) {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    return Object.entries(content as Record<string, unknown>)
      .filter(([, value]) => value !== "" && value != null)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
      .join("\n");
  }
  return "";
}

function DiarioPage() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const entries = useQuery({
    queryKey: ["journal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const progress = useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sem sessão");
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      return data;
    },
  });

  const save = async () => {
    const validation = journalTextSchema.safeParse(text);
    if (!validation.success) {
      toast.error(firstIssueMessage(validation));
      return;
    }
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setBusy(false);
      toast.error("Faça login novamente.");
      return;
    }
    const { error } = await supabase.from("journal_entries").insert({
      user_id: auth.user.id,
      kind: "livre",
      title: "Anotação livre",
      content: { texto: validation.data } as never,
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível salvar agora.");
      return;
    }
    setText("");
    toast.success("Registrado no seu diário.");
    await queryClient.invalidateQueries({ queryKey: ["journal"] });
  };

  const completed = progress.data?.completed_days?.length ?? 0;

  return (
    <AppShell title="Meu Diário" subtitle="Registre o que sentiu e veja sua evolução">
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: completed, label: "dias da trilha concluídos" },
          { value: entries.data?.length ?? 0, label: "registros no diário" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[1.6rem] border border-border/50 bg-card/85 p-4 shadow-soft backdrop-blur-sm"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-mint/30 blur-2xl"
            />
            <p className="relative text-3xl font-semibold tabular-nums">{stat.value}</p>
            <p className="relative text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <section className="mt-6 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft">
        <h2 className="text-base font-semibold">Como você está agora?</h2>
        <Textarea
          className="mt-3 min-h-28"
          placeholder="Escreva sem filtro. Ninguém além de você lê isso."
          value={text}
          maxLength={JOURNAL_TEXT_MAX_LENGTH}
          onChange={(event) => setText(event.target.value)}
        />
        <Button className="mt-3 w-full tap-scale" onClick={save} disabled={busy || !text.trim()}>
          Salvar no diário
        </Button>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-base font-semibold">Seus registros</h2>
        {(entries.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há registros. Cada anotação vira um marco da sua evolução.
          </p>
        ) : null}
        {(entries.data ?? []).map((entry) => (
          <article
            key={entry.id}
            className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft"
          >
            <header className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold">
                {entry.title ?? KIND_LABELS[entry.kind] ?? "Registro"}
              </p>
              <time className="shrink-0 text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleDateString("pt-BR")}
              </time>
            </header>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {renderContent(entry.content)}
            </p>
            {entry.day ? (
              <p className="mt-2 text-xs text-primary">Dia {entry.day} da trilha</p>
            ) : null}
          </article>
        ))}
      </section>
    </AppShell>
  );
}
