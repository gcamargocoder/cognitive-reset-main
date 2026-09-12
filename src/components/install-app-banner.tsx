import { useState } from "react";
import { Share, Smartphone, X } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

const DISMISS_KEY = "install-banner-dismissed";

export function InstallAppBanner() {
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1",
  );

  const showIosSteps = isIOS && !canInstall;
  if (isStandalone || dismissed || !(canInstall || showIosSteps)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage indisponível (modo privado); apenas oculta na sessão atual.
    }
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 }}
      className="relative rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-soft"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar aviso de instalação"
        className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      <Smartphone className="h-6 w-6 text-primary" />
      <h2 className="mt-3 pr-8 text-lg font-semibold sm:text-xl">Leve o app no seu bolso</h2>

      {showIosSteps ? (
        <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground sm:text-[0.95rem]">
          No iPhone: toque em <Share className="inline h-4 w-4 text-foreground" aria-hidden /> Compartilhar e
          selecione "Adicionar à Tela de Início".
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground sm:text-[0.95rem]">
            Instale o Método LIBERTAÇÃO na tela inicial para abrir mais rápido, mesmo offline.
          </p>
          <Button onClick={promptInstall} size="lg" className="tap-scale mt-4 h-14 w-full text-base">
            Instalar Aplicativo no Celular
          </Button>
        </>
      )}
    </motion.div>
  );
}
