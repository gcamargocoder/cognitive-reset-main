import { useState } from "react";
import { Heart, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PIX_KEY = "12d396ac-bb32-406d-bafc-2c8c2e4c97c0";

export function DonateDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      toast.success("Chave Pix copiada.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente: " + PIX_KEY);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Apoiar este projeto"
        onClick={() => setOpen(true)}
        className="relative shrink-0 overflow-visible rounded-full bg-background text-sos shadow-lift ring-1 ring-sos/25"
      >
        <span
          aria-hidden
          className="heart-ring pointer-events-none absolute inset-1.5 rounded-full border-2 border-sos"
        />
        <Heart className="heart-beat relative h-5 w-5 fill-sos/20" />
      </Button>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Apoie este Projeto</DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            Este aplicativo foi desenvolvido com o propósito de oferecer suporte, calma e bem-estar
            em momentos de necessidade. Mantê-lo atualizado, seguro e sem anúncios exige custos com
            hospedagem, infraestrutura e ferramentas. Se este aplicativo te ajudou de alguma forma e
            você se sentir motivado a contribuir para a continuidade do projeto, qualquer valor é
            muito bem-vindo!
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border bg-muted/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Chave Pix
          </p>
          <p className="mt-1 break-all font-display text-base font-semibold">{PIX_KEY}</p>
        </div>

        <Button size="lg" className="w-full tap-scale" onClick={copyKey}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar Chave Pix"}
        </Button>

        <div className="mt-2 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">Desenvolvido por:</p>
          <img
            src="/images/logo_gcsys.png"
            alt="GC-Sys"
            className="mx-auto mt-2 max-h-[42px] w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <a
            href="https://gc-sys.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Conheça nosso trabalho / Portfólio
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
