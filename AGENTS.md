# Notas para agentes

- Este é um app **TanStack Start** (SSR). Não existe `index.html`: o `<head>`,
  título e meta tags são definidos em `src/routes/__root.tsx` via `head()`.
- **Tailwind v4**: não há `tailwind.config.ts`. Os tokens de design (cores,
  raios, sombras) vivem em `src/styles.css` (`@theme` + `:root` / `.dark`).
- Gerenciador de pacotes: **Bun** (`bun install`, `bun run build`).
- Mantenha a branch em estado funcional: rode `bun run build` e
  `bunx tsc --noEmit` antes de finalizar.
- Regra de negócio da Trilha de 30 dias (trava de 24h, `completed_days`,
  `unlock_at`) não deve ser alterada sem pedido explícito.
