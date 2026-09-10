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

  return (
    <AppShell title="Trilha de 30 dias" subtitle={`Dia ${currentDay} de 30`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/85 p-5 shadow-soft backdrop-blur-sm"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-mint/30 blur-2xl"
        />
        <div className="relative flex items-center justify-between text-sm">
          <span className="font-medium">{completed.length} de 30 dias concluídos</span>
          <span className="tabular-nums text-muted-foreground">
            {Math.round((completed.length / 30) * 100)}%
          </span>
        </div>
        <Progress value={(completed.length / 30) * 100} className="relative mt-3" />
        {locked ? (
          <p className="relative mt-4 flex items-start gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm">
            <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
          const content = (
            <div
              className={cn(
                "group relative flex items-center gap-4 overflow-hidden rounded-[1.6rem] border border-border/50 bg-card/85 p-4 shadow-soft backdrop-blur-sm transition-all duration-300",
                available && "hover:-translate-y-0.5 hover:shadow-lift",
                !available && "opacity-55",
                isCurrent && !locked && "border-primary/40 shadow-glow",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold tabular-nums transition-transform duration-300 group-hover:scale-105",
                  done
                    ? "bg-mint text-mint-foreground"
                    : isCurrent
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-5 w-5" strokeWidth={2.4} /> : day.day}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{day.title}</p>
                <p className="truncate text-xs text-muted-foreground">{day.technique}</p>
              </div>
              {available ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          );

          return (
            <motion.li
              key={day.day}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
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
