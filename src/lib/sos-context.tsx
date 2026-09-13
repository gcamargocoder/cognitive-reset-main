import { createContext, useContext } from "react";

export type SosMode = "panico" | "ansiedade" | "irritabilidade";

type SosContextValue = {
  open: (mode?: SosMode) => void;
};

export const SosContext = createContext<SosContextValue | null>(null);

/** Abre o SOS Sheet global a partir de qualquer página dentro do AppShell. */
export function useSos() {
  const ctx = useContext(SosContext);
  if (!ctx) throw new Error("useSos deve ser usado dentro do AppShell.");
  return ctx;
}
