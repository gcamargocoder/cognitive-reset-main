import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronRight, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { SESSIONS } from "@/lib/library";

export const Route = createFileRoute("/_authenticated/biblioteca/")({
  component: BibliotecaPage,
});

function BibliotecaPage() {
  return (
    <AppShell title="Sessões & Biblioteca" subtitle="18 técnicas para usar quando precisar">
      <div className="space-y-10">
        {SESSIONS.map((session, s) => (
          <motion.section
            key={session.slug}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: s * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Sessão {s + 1}
            </span>
            <h2 className="mt-3 text-lg font-semibold">{session.title}</h2>
            <p className="text-sm text-muted-foreground">{session.subtitle}</p>

            <div className="mt-4 space-y-3">
              {session.science.map((block) => (
                <div
                  key={block.heading}
                  className="rounded-[1.5rem] border border-border/50 bg-card/60 p-4 backdrop-blur-sm"
                >
                  <h3 className="text-sm font-semibold">{block.heading}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{block.body}</p>
                </div>
              ))}
            </div>

            <ul className="mt-4 space-y-3">
              {session.techniques.map((technique) => (
                <li key={technique.slug}>
                  <Link
                    to="/biblioteca/$slug"
                    params={{ slug: technique.slug }}
                    className="group flex items-center gap-4 rounded-[1.6rem] border border-border/50 bg-card/85 p-4 shadow-soft backdrop-blur-sm transition-all duration-300 tap-scale hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-sm font-semibold tabular-nums text-primary-foreground transition-transform duration-300 group-hover:scale-105">
                      {technique.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{technique.name}</span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {technique.when}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>
    </AppShell>
  );
}
