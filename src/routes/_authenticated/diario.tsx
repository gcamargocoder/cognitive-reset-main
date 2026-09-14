import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { IrritabilityThermometer } from "@/components/irritability-thermometer";
import { supabase } from "@/integrations/supabase/client";
import { JOURNAL_TEXT_MAX_LENGTH, firstIssueMessage, journalTextSchema } from "@/lib/validation";

const IRRITABILITY_KINDS = [
  "irritability_checkin",
  "irritability_pause",
  "irritability_sos",
] as const;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const chartConfig = {
  level: { label: "Nível de irritação", color: "var(--sos)" },
} satisfies ChartConfig;

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
  checkin: "Como você se sentiu",
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

  const irritability = useQuery({
    queryKey: ["irritability-history"],
    queryFn: async () => {
      const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
      const { data, error } = await supabase
        .from("journal_entries")
        .select("kind, content, created_at")
        .in("kind", IRRITABILITY_KINDS)
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const irritabilityStats = useMemo(() => {
    const rows = irritability.data ?? [];
    const checkins = rows.filter((r) => r.kind === "irritability_checkin");
    const pauses = rows.filter(
      (r) => r.kind === "irritability_pause" || r.kind === "irritability_sos",
    );

    const levelOf = (row: (typeof rows)[number]) => (row.content as { level?: number })?.level ?? 0;
    const feltBetterOf = (row: (typeof rows)[number]) =>
      (row.content as { feltBetter?: boolean })?.feltBetter === true;

    const chartData = checkins.map((row) => ({
      date: new Date(row.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      level: levelOf(row),
    }));

    const peakCount = checkins.filter((row) => levelOf(row) >= 4).length;
    const successRate =
      pauses.length > 0
        ? Math.round((pauses.filter(feltBetterOf).length / pauses.length) * 100)
        : null;

    const now = Date.now();
    const avgInWindow = (fromMs: number, toMs: number) => {
      const window = checkins.filter((row) => {
        const age = now - new Date(row.created_at).getTime();
        return age >= fromMs && age < toMs;
      });
      if (window.length === 0) return null;
      return window.reduce((sum, row) => sum + levelOf(row), 0) / window.length;
    };
    const last7Avg = avgInWindow(0, 7 * 86_400_000);
    const prev7Avg = avgInWindow(7 * 86_400_000, 14 * 86_400_000);

    let trendMessage = "Registre seu nível por alguns dias para ver a evolução aqui.";
    if (last7Avg !== null && prev7Avg !== null) {
      if (last7Avg < prev7Avg - 0.3)
        trendMessage = "Sua irritabilidade está diminuindo nos últimos dias.";
      else if (last7Avg > prev7Avg + 0.3)
        trendMessage = "Seus níveis subiram um pouco — vale reforçar as pausas táticas.";
      else trendMessage = "Sua constante está estável nos últimos dias.";
    }

    return { chartData, peakCount, successRate, trendMessage };
  }, [irritability.data]);

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
      <IrritabilityThermometer />

      <div className="mt-6 grid grid-cols-2 gap-3">
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

      {irritabilityStats.chartData.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft">
          <h2 className="text-base font-semibold">Evolução da irritabilidade</h2>
          <p className="mt-1 text-sm text-muted-foreground">{irritabilityStats.trendMessage}</p>

          <ChartContainer config={chartConfig} className="mt-4 aspect-auto h-40 w-full">
            <LineChart data={irritabilityStats.chartData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis
                domain={[1, 5]}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="level"
                type="monotone"
                stroke="var(--color-level)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3">
              <p className="text-2xl font-semibold tabular-nums">{irritabilityStats.peakCount}</p>
              <p className="text-xs text-muted-foreground">picos (nível 4-5) em 30 dias</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-3">
              <p className="text-2xl font-semibold tabular-nums">
                {irritabilityStats.successRate !== null ? `${irritabilityStats.successRate}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">sucesso nas pausas guiadas</p>
            </div>
          </div>
        </section>
      ) : null}

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
