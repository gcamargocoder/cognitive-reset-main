import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Quote } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ToolRenderer } from "@/components/tools/tool-renderer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { completeDay, saveChecklistState } from "@/lib/progress.functions";
import type { Technique } from "@/lib/library";

export const Route = createFileRoute("/_authenticated/trilha/$day")({
  component: DayPage,
});

function DayPage() {
  const { day: dayParam } = Route.useParams();
  const day = Number(dayParam);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const finishDay = useServerFn(completeDay);
  const saveState = useServerFn(saveChecklistState);
  const [checks, setChecks] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);

  const content = useQuery({
    queryKey: ["day", day],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_contents")
        .select("*")
        .eq("day", day)
        .maybeSingle();
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

  const checklist = useMemo(
    () => ((content.data?.checklist ?? []) as string[]).filter(Boolean),
    [content.data?.checklist],
  );

  useEffect(() => {
    const saved = (progress.data?.checklist_state ?? {}) as Record<string, boolean[]>;
    setChecks(saved[String(day)] ?? checklist.map(() => false));
  }, [checklist, progress.data?.checklist_state, day]);

  const done = progress.data?.completed_days?.includes(day) ?? false;
  const allChecked =
    checklist.length > 0 && checks.length === checklist.length && checks.every(Boolean);

  const toggle = (index: number, value: boolean) => {
    const next = checks.map((item, i) => (i === index ? value : item));
    setChecks(next);
    void saveState({ data: { day, state: next } });
  };

  const complete = async () => {
    setBusy(true);
    try {
      await finishDay({ data: { day, checklist: checks } });
      await queryClient.invalidateQueries({ queryKey: ["progress"] });
      toast.success("Dia concluído. Nos vemos amanhã.");
      navigate({ to: "/trilha" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir o dia.");
    } finally {
      setBusy(false);
    }
  };

  const technique: Technique | null = content.data
    ? {
        slug: `dia-${day}`,
        number: day,
        name: content.data.technique,
        whatWhy: content.data.science,
        preparation: "",
        steps: [],
        tool: content.data.tool as Technique["tool"],
        toolConfig: (content.data.tool_config ?? {}) as Record<string, unknown>,
      }
    : null;

  return (
    <AppShell
      title={content.data?.title ?? `Dia ${day}`}
      subtitle={`Dia ${day} · Semana ${content.data?.week ?? 1}`}
      action={
        <Button asChild variant="ghost" size="icon" aria-label="Voltar para a trilha">
          <Link to="/trilha">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      }
    >
      {content.data?.quote ? (
        <blockquote className="flex gap-3 rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
          <Quote className="h-5 w-5 shrink-0 opacity-80" />
          <p className="text-sm leading-relaxed">{content.data.quote}</p>
        </blockquote>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">A ciência por trás</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {content.data?.science}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Prática de hoje: {content.data?.technique}
        </h2>
        {technique ? <ToolRenderer technique={technique} day={day} /> : null}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Checklist do dia</h2>
        <ul className="mt-3 space-y-3">
          {checklist.map((item, index) => (
            <li key={item} className="flex items-start gap-3">
              <Checkbox
                id={`check-${index}`}
                checked={checks[index] ?? false}
                disabled={done}
                onCheckedChange={(value) => toggle(index, value === true)}
              />
              <label htmlFor={`check-${index}`} className="text-sm leading-snug">
                {item}
              </label>
            </li>
          ))}
        </ul>

        {done ? (
          <p className="mt-5 rounded-xl bg-mint/40 px-4 py-3 text-sm text-mint-foreground">
            Você já concluiu este dia. Pode revisitar a prática sempre que quiser.
          </p>
        ) : (
          <Button
            className="mt-5 w-full tap-scale"
            disabled={!allChecked || busy}
            onClick={complete}
          >
            {allChecked ? "Concluir o dia" : "Marque todos os itens para concluir"}
          </Button>
        )}
      </section>
    </AppShell>
  );
}
