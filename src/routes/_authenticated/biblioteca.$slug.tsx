import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, Lightbulb } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ToolRenderer } from "@/components/tools/tool-renderer";
import { TonePlayer } from "@/components/tone-player";
import { findTechnique, findTechniqueSession } from "@/lib/library";

export const Route = createFileRoute("/_authenticated/biblioteca/$slug")({
  component: TechniquePage,
});

function TechniquePage() {
  const { slug } = Route.useParams();
  const technique = findTechnique(slug);
  const sessionSlug = findTechniqueSession(slug);

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
          <Link to="/biblioteca" search={{ session: sessionSlug }}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      }
    >
      {technique.frequency ? (
        <TonePlayer src={technique.frequency.src} label={technique.frequency.label} />
      ) : null}

      <section className="mt-6 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-primary">O que é e por que funciona</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{technique.whatWhy}</p>
      </section>

      {technique.caution ? (
        <div className="mt-4 flex gap-3 rounded-3xl border border-sos/40 bg-sos/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-sos" />
          <p>{technique.caution}</p>
        </div>
      ) : null}

      <section className="mt-6 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft">
        <h2 className="text-base font-semibold">Preparação</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {technique.preparation}
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft">
        <h2 className="text-base font-semibold">Passo a passo guiado</h2>
        <ol className="mt-3 space-y-3 text-sm leading-relaxed">
          {technique.steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="font-semibold text-primary">Passo {index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Praticar agora</h2>
        <ToolRenderer technique={technique} />
      </section>

      {technique.tip ? (
        <section className="mt-6 flex gap-3 rounded-3xl border border-primary/25 bg-primary-soft/40 p-4 text-sm">
          <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
          <p>
            <span className="font-semibold">Dica de apoio: </span>
            {technique.tip}
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}
