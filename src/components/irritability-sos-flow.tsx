import { useEffect, useState } from "react";
import { Snowflake, Footprints, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useJournalSave } from "@/components/tools/tool-renderer";

type Phase = "intro" | "cold" | "motor" | "done";

const COLD_SECS = 90;
const MOTOR_SECS = 60;

export function IrritabilitySosFlow({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [left, setLeft] = useState(COLD_SECS);
  const [running, setRunning] = useState(false);
  const [feltBetter, setFeltBetter] = useState<boolean | null>(null);
  const { save, saving } = useJournalSave("irritability_sos", "SOS Irritabilidade");

  useEffect(() => {
    if (!running || (phase !== "cold" && phase !== "motor")) return;
    if (left <= 0) {
      setRunning(false);
      setPhase(phase === "cold" ? "motor" : "done");
      setLeft(phase === "cold" ? MOTOR_SECS : 0);
      return;
    }
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running, left, phase]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Vamos fazer duas coisas, uma depois da outra. Primeiro, um pouco de frio no rosto — isso
          ajuda o corpo a desacelerar rápido. Depois, um movimento intenso e curto, para gastar a
          energia que ficou acumulada.
        </p>
        <Button
          size="lg"
          className="h-auto w-full justify-start gap-3 whitespace-normal bg-sos py-4 text-left text-sos-foreground hover:bg-sos/90"
          onClick={() => {
            setPhase("cold");
            setLeft(COLD_SECS);
            setRunning(true);
          }}
        >
          <Snowflake className="h-6 w-6 shrink-0" />
          <span>
            <span className="block font-semibold">Começar (90s + 60s)</span>
            <span className="block text-xs opacity-90">Frio no rosto, depois movimento</span>
          </span>
        </Button>
      </div>
    );
  }

  if (phase === "cold") {
    return (
      <div className="space-y-4 text-center">
        <Snowflake className="mx-auto h-10 w-10 text-primary" />
        <p className="text-sm leading-relaxed">
          Passe gelo ou um pano com água bem fria nas têmporas (lado da testa), no pescoço e nos
          pulsos. Se preferir, mergulhe o rosto em uma bacia com água gelada por alguns segundos.
        </p>
        <span className="font-display text-5xl">
          {mm}:{ss}
        </span>
        <Button variant="secondary" onClick={() => setRunning((r) => !r)} className="h-11 w-full">
          {running ? "Pausar" : "Retomar"}
        </Button>
      </div>
    );
  }

  if (phase === "motor") {
    return (
      <div className="space-y-4 text-center">
        <Footprints className="mx-auto h-10 w-10 text-primary" />
        <p className="text-sm leading-relaxed">
          Agora mexa o corpo com força por um minuto: marche no lugar levantando bem os joelhos,
          pule polichinelos, ou suba e desça de um degrau. Vale qualquer movimento que canse um
          pouco.
        </p>
        <span className="font-display text-5xl">
          {mm}:{ss}
        </span>
        <Button variant="secondary" onClick={() => setRunning((r) => !r)} className="h-11 w-full">
          {running ? "Pausar" : "Retomar"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-base font-medium">Como você está agora, comparado a antes?</p>
      <div className="flex justify-center gap-3">
        <Button
          size="lg"
          variant={feltBetter === true ? "default" : "outline"}
          onClick={() => setFeltBetter(true)}
        >
          <ThumbsUp className="mr-2 h-4 w-4" /> Melhor
        </Button>
        <Button
          size="lg"
          variant={feltBetter === false ? "default" : "outline"}
          onClick={() => setFeltBetter(false)}
        >
          <ThumbsDown className="mr-2 h-4 w-4" /> Igual
        </Button>
      </div>
      <Button
        size="lg"
        className="w-full tap-scale"
        disabled={saving || feltBetter === null}
        onClick={async () => {
          await save({ feltBetter });
          onFinish();
        }}
      >
        Concluir
      </Button>
    </div>
  );
}
