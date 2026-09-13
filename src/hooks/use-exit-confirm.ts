import { useEffect, useRef, useState } from "react";

/** Intercepta o botão/gesto de voltar para confirmar antes de sair do app. */
export function useExitConfirm(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const confirmingRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    window.history.pushState({ exitGuard: true }, "");

    const onPopState = () => {
      if (confirmingRef.current) return;
      setOpen(true);
      window.history.pushState({ exitGuard: true }, "");
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [enabled]);

  const confirmExit = () => {
    confirmingRef.current = true;
    setOpen(false);
    window.history.go(-2);
  };

  const cancelExit = () => setOpen(false);

  return { open, confirmExit, cancelExit };
}
