import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SESSIONS } from "@/lib/library";

const SESSION_SLUGS = SESSIONS.map((s) => s.slug) as [string, ...string[]];

const bibliotecaSearchSchema = z.object({
  session: z.enum(SESSION_SLUGS).optional(),
});

export const Route = createFileRoute("/_authenticated/biblioteca/")({
  validateSearch: bibliotecaSearchSchema,
  component: BibliotecaPage,
});

const TAB_LABELS: Record<string, string> = {
  ansiedade: "Ansiedade",
  panico: "Pânico",
  depressao: "Depressão",
  irritabilidade: "Irritabilidade",
};

function SessionPanel({ session, index }: { session: (typeof SESSIONS)[number]; index: number }) {
  const [scienceOpen, setScienceOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Cabeçalho da seção — respirado e isolado */}
      <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sessão {index + 1}
        </span>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          {TAB_LABELS[session.slug] ?? session.title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{session.subtitle}</p>
      </header>

      {/* A ciência — recolhível para não bloquear as técnicas */}
      <Collapsible open={scienceOpen} onOpenChange={setScienceOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between rounded-2xl border border-border bg-card px-5 py-3.5 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60",
          )}
        >
          Entender a ciência
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              scienceOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="space-y-3">
            {session.science.map((block) => (
              <div
                key={block.heading}
                className="rounded-2xl border border-border bg-secondary/50 p-4"
              >
                <h3 className="text-sm font-semibold text-foreground">{block.heading}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{block.body}</p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Técnicas da seção */}
      <div>
        <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {session.techniques.length} técnicas
        </h3>
        <ul className="space-y-3">
          {session.techniques.map((technique) => (
            <li key={technique.slug}>
              <Link
                to="/biblioteca/$slug"
                params={{ slug: technique.slug }}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 tap-scale hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-semibold tabular-nums text-primary">
                  {technique.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug text-foreground">
                    {technique.name}
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {technique.whatWhy}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function BibliotecaPage() {
  const { session } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const activeSession = session ?? SESSIONS[0]!.slug;

  return (
    <AppShell title="Sessões & Biblioteca" subtitle="21 técnicas para usar quando precisar">
      <Tabs
        value={activeSession}
        onValueChange={(value) =>
          navigate({ search: { session: value as typeof activeSession }, replace: true })
        }
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
          {SESSIONS.map((session) => (
            <TabsTrigger
              key={session.slug}
              value={session.slug}
              className="rounded-xl px-1 py-2 text-[11px] data-[state=active]:shadow-sm sm:text-sm"
            >
              {TAB_LABELS[session.slug] ?? session.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {SESSIONS.map((session, i) => (
          <TabsContent key={session.slug} value={session.slug} className="mt-6">
            <SessionPanel session={session} index={i} />
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}
