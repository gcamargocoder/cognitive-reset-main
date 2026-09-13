import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useJournalSave } from "@/components/tools/tool-renderer";
import { useSos } from "@/lib/sos-context";
import { cn } from "@/lib/utils";

const LEVELS = [
  { level: 1, label: "Calmo" },
  { level: 2, label: "Tranquilo" },
  { level: 3, label: "Tenso" },
  { level: 4, label: "Pavio curto" },
  { level: 5, label: "Explosão" },
] as const;

export function IrritabilityThermometer() {
  const [selected, setSelected] = useState<number | null>(null);
  const { save } = useJournalSave("irritability_checkin", "Termômetro da Irritabilidade");
  const sos = useSos();

  const choose = async (level: number) => {
    setSelected(level);
    await save({ level });
    if (level === 5) sos.open("irritabilidade");
  };

  return (
    <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft">
      <h2 className="text-base font-semibold">Termômetro da irritabilidade</h2>
      <p className="mt-1 text-sm text-muted-foreground">Como está seu nível de irritação agora?</p>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {LEVELS.map(({ level, label }) => (
          <button
            key={level}
            type="button"
            onClick={() => choose(level)}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-medium transition-colors",
              selected === level
                ? "border-sos bg-sos text-sos-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/60",
            )}
          >
            <span className="text-base font-semibold tabular-nums">{level}</span>
            <span className="leading-none">{label}</span>
          </button>
        ))}
      </div>

      {selected !== null && selected <= 2 ? (
        <p className="mt-4 rounded-2xl bg-mint/40 px-4 py-3 text-sm text-mint-foreground">
          Bom sinal. Continue no seu ritmo — registrar isso já ajuda a manter a constante estável.
        </p>
      ) : null}

      {selected !== null && (selected === 3 || selected === 4) ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-4">
          <p className="text-sm font-medium">
            Vale uma pausa tática de 3 minutos antes de continuar. Escolha uma:
          </p>
          <div className="grid gap-2">
            <Button
              asChild
              size="lg"
              className="h-auto w-full justify-center whitespace-normal py-3 text-center leading-snug"
            >
              <Link to="/biblioteca/$slug" params={{ slug: "relaxamento-muscular-progressivo" }}>
                Relaxamento Muscular Progressivo
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-auto w-full justify-center whitespace-normal py-3 text-center leading-snug"
            >
              <Link to="/biblioteca/$slug" params={{ slug: "visao-panoramica-somatica" }}>
                Visão Panorâmica Somática
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
