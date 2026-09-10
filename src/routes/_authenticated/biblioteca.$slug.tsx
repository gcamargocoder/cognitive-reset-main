import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ToolRenderer } from "@/components/tools/tool-renderer";
import { findTechnique } from "@/lib/library";

export const Route = createFileRoute("/_authenticated/biblioteca/$slug")({
  component: TechniquePage,
});

function TechniquePage() {
  const { slug } = Route.useParams();
  const technique = findTechnique(slug);

  if (!technique) {
    return (
      <AppShell title="Técnica não encontrada">
        <Button asChild variant="outline">
          <Link to="/biblioteca">Voltar para a biblioteca</Link>
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={technique.name}
      subtitle={`Técnica ${technique.number}`}
      action={
        <Button asChild variant="ghost" size="icon" aria-label="Voltar para a biblioteca">
          <Link to="/biblioteca">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      }
    >
      <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-primary">Quando usar</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{technique.when}</p>
      </section>

      {technique.caution ? (
        <div className="mt-4 flex gap-3 rounded-3xl border border-sos/40 bg-sos/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-sos" />
          <p>{technique.caution}</p>
        </div>
      ) : null}

      {technique.steps.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft">
          <h2 className="text-base font-semibold">Passo a passo</h2>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed">
            {technique.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="font-semibold text-primary">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Praticar agora</h2>
        <ToolRenderer technique={technique} />
      </section>

      <section className="mt-6 rounded-3xl border border-border/60 bg-card/60 p-5">
        <h2 className="text-base font-semibold">Por que funciona</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{technique.why}</p>
      </section>
    </AppShell>
  );
}
