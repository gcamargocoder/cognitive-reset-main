import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Lock, Play, Timer } from "lucide-react";
import { motion } from "motion/react";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/app-shell";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapMe } from "@/lib/progress.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trilha/")({
  component: TrilhaPage,
});

function useCountdown(unlockAt: string | null | undefined) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!unlockAt) {
      setLeft(0);
      return;
    }
    const tick = () => setLeft(Math.max(0, new Date(unlockAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlockAt]);
  return left;
}

export function formatLeft(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function TrilhaPage() {
  const bootstrap = useServerFn(bootstrapMe);

  const progress = useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sem sessão");
      let { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!data) {
        await bootstrap({ data: undefined as never });
        const retry = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", auth.user.id)
          .maybeSingle();
        data = retry.data;
      }
      return data;
    },
  });

  const days = useQuery({
    queryKey: ["days"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_contents")
        .select("day, week, title, technique")
        .order("day");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const completed = progress.data?.completed_days ?? [];
  const currentDay = progress.data?.current_day ?? 1;
  const left = useCountdown(progress.data?.unlock_at);
  const locked = left > 0;
  const pct = Math.round((completed.length / 30) * 100);

  return (
    <AppShell title="Trilha de 30 dias" subtitle={`Dia ${currentDay} de 30`}>
      {/* Barra de progresso geral — minimalista e motivadora */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">
            {completed.length} de 30 dias concluídos
          </span>
          <span className="text-sm font-semibold tabular-nums text-primary">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-3" />
        {locked ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-serene/10 px-4 py-3 text-sm text-foreground">
            <Timer className="mt-0.5 h-4 w-4 shrink-0 text-serene" />
            <span>
              Próximo dia libera em <strong className="tabular-nums">{formatLeft(left)}</strong>. Um
              dia por vez — o cérebro precisa desse intervalo para consolidar.
            </span>
          </p>
        ) : null}
      </motion.div>

      <ul className="mt-6 space-y-3">
        {(days.data ?? []).map((day, i) => {
          const done = completed.includes(day.day);
          const isCurrent = day.day === currentDay;
          const available = done || (isCurrent && !locked);
          const waiting = isCurrent && locked;

          const content = (
            <div
              className={cn(
                "flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-200",
                done && "border-mint bg-mint/30",
                available && !done && "border-serene bg-card ring-1 ring-serene/40",
                available && "hover:-translate-y-0.5 hover:shadow-lift",
                waiting && "border-border bg-card",
                !available && !waiting && "border-border bg-card opacity-55",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
                  done && "bg-mint text-mint-foreground",
                  available && !done && "bg-serene text-serene-foreground",
                  !available && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-5 w-5" strokeWidth={2.4} /> : day.day}
              </div>

              <div className="min-w-0 flex-1">
                {available && !done ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-serene">
                    Em andamento
                  </span>
                ) : null}
                <p className="text-sm font-semibold leading-snug text-foreground">{day.title}</p>
                <p className="text-xs text-muted-foreground">{day.technique}</p>
              </div>

              {available ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
              ) : waiting ? (
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {formatLeft(left)}
                </span>
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          );

          return (
            <motion.li
              key={day.day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, delay: Math.min(i, 8) * 0.035 }}
            >
              {available ? (
                <Link
                  to="/trilha/$day"
                  params={{ day: String(day.day) }}
                  className="block tap-scale"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </motion.li>
          );
        })}
      </ul>
    </AppShell>
  );
}
