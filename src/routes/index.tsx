import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Brain, HeartPulse, NotebookPen, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InstallAppBanner } from "@/components/install-app-banner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Método LIBERTAÇÃO — cuide da ansiedade em 30 dias" },
      {
        name: "description",
        content:
          "Programa guiado de 30 dias com técnicas de neurociência e psicologia cognitiva para ansiedade, pânico e depressão. Trilha diária, SOS emocional e diário de evolução.",
      },
      { property: "og:title", content: "Método LIBERTAÇÃO — cuide da ansiedade em 30 dias" },
      {
        property: "og:description",
        content:
          "Trilha de 30 dias, 18 técnicas guiadas e SOS emocional para atravessar crises de ansiedade e pânico.",
      },
    ],
  }),
  component: Landing,
});

const pillars = [
  {
    icon: Brain,
    title: "Trilha de 30 dias",
    body: "Um passo por dia, com ciência explicada em linguagem simples e checklist para fechar o ciclo.",
  },
  {
    icon: HeartPulse,
    title: "SOS emocional",
    body: "Botão de emergência com respiração e ancoragem guiadas para o momento da crise.",
  },
  {
    icon: NotebookPen,
    title: "Diário e evolução",
    body: "Registre o que sentiu e acompanhe sua constância ao longo das semanas.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-calm">
      <main className="mx-auto max-w-2xl px-6 pb-20 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Baseado em neurociência
          </span>
          <h1 className="mt-5 text-[2.75rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Método LIBERTAÇÃO
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Um caminho de 30 dias para entender o que acontece no seu corpo e aprender, com
            gentileza, a regular ansiedade, crises de pânico e desânimo.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="tap-scale h-14 text-base">
              <Link to="/auth" search={{ mode: "up" }}>
                Criar conta
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="tap-scale h-14 text-base">
              <Link to="/auth" search={{ mode: "in" }}>
                Já tenho conta
              </Link>
            </Button>
          </div>
        </motion.div>

        <div className="mt-10">
          <InstallAppBanner />
        </div>

        <div className="mt-10 grid gap-5">
          {pillars.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
              className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-soft"
            >
              <Icon className="h-7 w-7 text-primary" />
              <h2 className="mt-3 text-xl font-semibold">{title}</h2>
              <p className="mt-1.5 text-base text-muted-foreground">{body}</p>
            </motion.div>
          ))}
        </div>

        <p className="mt-14 text-sm leading-relaxed text-muted-foreground">
          Este aplicativo é material de apoio educativo e não substitui acompanhamento profissional.
          Em risco imediato, ligue 188 (CVV) ou procure emergência.
        </p>
      </main>
    </div>
  );
}
