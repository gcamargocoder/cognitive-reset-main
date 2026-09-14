import { useEffect, useRef, useState } from "react";

type GuardState = { exitGuard: true };

const GUARD_STATE: GuardState = { exitGuard: true };

function isGuardState(state: unknown): state is GuardState {
  return typeof state === "object" && state !== null && (state as GuardState).exitGuard === true;
}

/**
 * Intercepta o botão/gesto de voltar apenas quando não há mais nenhuma tela
 * do app para voltar (ou seja, quando o histórico chega de volta ao estado
 * sentinela empurrado aqui). Enquanto houver telas anteriores no app, o
 * voltar normal do navegador/roteador continua funcionando sem interferência.
 */
export function useExitConfirm(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const armedRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || armedRef.current) return;
    armedRef.current = true;
    window.history.pushState(GUARD_STATE, "");

    // Não empurra um novo marcador aqui: fazer isso criava DOIS marcadores
    // empilhados, e "Sim, sair" só conseguia voltar um passo, caindo no
    // outro marcador e reabrindo o diálogo (parecia travado, piscando).
    // Sem recolocar nada, "Sim, sair" (history.back()) vai direto pro que
    // existia antes do marcador original, e "Não" (history.forward())
    // volta pra tela de onde o usuário tentou sair — o forward-entry
    // continua disponível porque back() nunca apaga o histórico à frente.
    const onPopState = (event: PopStateEvent) => {
      if (!isGuardState(event.state)) return;
      setOpen(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [enabled]);

  const confirmExit = () => {
    setOpen(false);
    // Deixa o navegador/SO tratar a saída de verdade: em PWA instalado isso
    // minimiza/fecha o app; em aba de navegador comum, sai para o que veio
    // antes do app. Um script não pode forçar o fechamento do app.
    window.history.back();
  };

  const cancelExit = () => {
    setOpen(false);
    window.history.forward();
  };

  return { open, confirmExit, cancelExit };
}
