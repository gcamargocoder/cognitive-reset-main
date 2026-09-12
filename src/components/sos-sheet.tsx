import { useState } from "react";
import { HeartPulse, Wind } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ToolRenderer } from "@/components/tools/tool-renderer";
import { SOS } from "@/lib/library";

type Mode = "panico" | "ansiedade";

export function SosSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [index, setIndex] = useState(0);
  const list = mode ? SOS[mode] : [];
  const technique = list[index];

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setMode(null);
      setIndex(0);
    }
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>SOS emocional</SheetTitle>
          <SheetDescription>
            Você está seguro. Escolha o que está acontecendo agora e siga um passo por vez.
          </SheetDescription>
        </SheetHeader>

        {!mode ? (
          <div className="grid gap-3 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <Button
              size="lg"
              className="h-auto w-full justify-start gap-3 bg-sos py-4 text-left text-sos-foreground hover:bg-sos/90"
              onClick={() => setMode("panico")}
            >
              <HeartPulse className="h-6 w-6 shrink-0" />
              <span>
                <span className="block font-semibold">Estou em crise de pânico</span>
                <span className="block text-xs opacity-90">Reflexo do mergulho e surfar a onda</span>
              </span>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto w-full justify-start gap-3 py-4 text-left"
              onClick={() => setMode("ansiedade")}
            >
              <Wind className="h-6 w-6 shrink-0" />
              <span>
                <span className="block font-semibold">Estou muito ansioso</span>
                <span className="block text-xs text-muted-foreground">
                  Respiração do recomeço e ancoragem 5-4-3-2-1
                </span>
              </span>
            </Button>
            <p className="pt-2 text-xs text-muted-foreground">
              Em risco imediato, ligue 188 (CVV) ou procure emergência. Este app é apoio, não
              substitui atendimento profissional.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="flex w-full flex-col gap-2">
              {list.map((item, i) => (
                <Button
                  key={item.slug}
                  size="lg"
                  className="h-11 w-full justify-center text-center"
                  variant={i === index ? "default" : "outline"}
                  onClick={() => setIndex(i)}
                >
                  {item.name.split("(")[0]}
                </Button>
              ))}
            </div>
            {technique ? (
              <>
                <ol className="space-y-2 text-sm">
                  {technique.steps.map((step, i) => (
                    <li key={step} className="flex gap-2">
                      <span className="font-semibold text-primary">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <ToolRenderer technique={technique} />
              </>
            ) : null}
            <Button variant="ghost" className="h-11 w-full" onClick={() => setMode(null)}>
              Voltar
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
