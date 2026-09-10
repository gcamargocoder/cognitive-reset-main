# Liberate Mind

Crie um aplicativo web responsivo no formato Progressive Web App (PWA) instalável, focado em saúde mental e regulação emocional, chamado "Método LIBERTAÇÃO", baseado em neurociência e psicologia cognitiva.

---

### 1. UX/UI & DESIGN SYSTEM (REQUISITO CRÍTICO)

- **Mobile-First & App-Like:** A interface deve ser desenhada prioritariamente para telas de celular, com navegação fluida por bar de abas inferior (Bottom Navigation Bar), parecendo 100% um aplicativo nativo iOS/Android.

- **PWA Instalável:** Incluir arquivo webmanifest, ícones, cores de tema e Service Worker para permitir que o usuário adicione o app à tela inicial (Android/iOS) e instale com 1 clique.

- **Estética & Design Visual (UI):**

  - Paleta de cores: Tons suaves de azul acolhedor, verde menta equilibrado, bege neutro e texto grafite/escuro com alto contraste e legibilidade.

  - Animações e Microinterações (Framer Motion): Transições suaves entre páginas, efeitos de clique e animações relaxantes para exercícios de respiração.

  - Componentes modernos (Shadcn/UI, Tailwind CSS, ícones Lucide-React).

- **Experiência do Usuário (UX):** Interface extremamente clara, intuitiva e sem poluição. Sem gatilhos visuais de estresse ou pressa.

---

### 2. AUTENTICAÇÃO E SESSÃO PERSISTENTE (Supabase)

- **Login Único e Persistente:** O sistema deve manter a sessão do usuário ativa continuamente (persistência de token/JWT via Supabase Auth). Uma vez logado, o usuário JAMAIS deve precisar fazer login novamente ao reabrir o app, a menos que clique explicitamente em "Sair da conta".

- **Métodos de Login:** E-mail/Senha e Google Auth.

---

### 3. REGRA DE NEGÓCIO: TRILHA DOS 30 DIAS (Trava Temporal de 24 Horas)

- O **Plano de 30 Dias** funciona estritamente em um sistema de cronograma sequencial bloqueado:

  - No primeiro acesso, apenas o **Dia 1** fica liberado.

  - Cada dia contém conteúdos pedagógicos curtos, vídeos/mídias demonstrativas, infográficos explicativos e um checklist de tarefas/práticas.

  - O botão "Concluir Dia [X]" só é ativado após o usuário marcar os checklists/exercícios obrigatórios do dia.

  - **Mecanismo de Bloqueio de 24 Horas:** Ao concluir o dia atual, o Supabase registra a data/hora exata (`completed_at`). Uma contagem regressiva visual de 24 horas é exibida no card do próximo dia (ex: "Dia 2 será liberado em 23h 59m").

  - O usuário não pode pular etapas nem antecipar módulos futuros.

---

### 4. ESTRUTURA DO APLICATIVO E TELAS (Navegação Inferior)

#### A. Tela Principal: "Trilha 30 Dias" (Home)

- Header acolhedor com frase do dia e botão de rápido acesso **SOS Pânico/Ansiedade**.

- Card principal com o status do dia atual e cronômetro regressivo se o próximo dia estiver bloqueado.

- Timeline interativa dos 30 dias (Ícones: Check verde para concluídos, destaque animado para o dia atual e cadeado para dias futuros).

- **Conteúdo do Dia Liberado:**

  1. _A Ciência Por Trás:_ Explicação didática e leve em texto/áudio.

  2. _Mídia Demonstrativa:_ Player de vídeo/áudio ou infográfico visual da técnica.

  3. _Passo a Passo Interativo:_ Checklist para marcar o progresso.

  4. _Ferramenta Interativa:_ Cronômetros/timers embutidos para respirações ou diário digital configurado para o tema do dia (Ex: Brain Dump de 10 min com botão virtual de "Rasgar/Limpar Papel", Tribunal dos Pensamentos, Registro dos 3 Momentos).

#### B. Tela / Modal "SOS Emergência" (Acesso Rápido Fixo no Header)

- Botão em destaque visual imediato para socorro em momentos de crise agudíssima:

  - **SOS Pânico:** Guia interativo e visual imediato para "Reflexo do Mergulho / Água Fria" e "Surfar a Onda".

  - **SOS Ansiedade:** Guia de animação expansiva para "Respiração do Recomeço / Suspiro Fisiológico" e "Ancoragem 5-4-3-2-1".

#### C. Tela "Sessões & Biblioteca"

Acesso direto para consulta livre de todas as 18 técnicas do Método LIBERTAÇÃO organizadas em 3 sessões:

1. **Sessão 1 - Ansiedade:** Explicação neurocientífica (Amígdala vs. Córtex Pré-Frontal) + Respiração do Recomeço, Ancoragem 5-4-3-2-1, Respiração Quadrada, Brain Dump e Examinando o Pensamento.

2. **Sessão 2 - Pânico:** Curva do Pânico (~10 min) e Sintomas Físicos Reais + Reflexo do Mergulho, Surfar a Onda, Exposição Interoceptiva e Regulação pelo Nervo Vago.

3. **Sessão 3 - Depressão:** Neurotransmissores (Serotonina, Dopamina, Norepinefrina) e Ciclo da Ação + Tribunal dos Pensamentos, Desfusão Cognitiva, Passos Ridiculamente Pequenos e Movimento Rítmico.

#### D. Tela "Meu Diário & Evolução"

- Histórico dos registros escritos feitos pelo usuário (Registro dos 3 Momentos, Anotações do Tribunal dos Pensamentos, Mapeamento de Crises).

- Gráfico visual de ofensiva/constância (dias concluídos).

---

### 5. PAINEL DO SUPERADMINISTRADOR (`/admin`)

- Acesso exclusivo para usuários com função `admin` no Supabase:

  - Dashboard de Métricas: Total de usuários cadastrados, usuários ativos no dia, gráfico de retenção/conclusão do Plano de 30 Dias.

  - Tabela de gerenciamento de usuários com opção de desbloquear/avançar manualmente o dia de um usuário específico, se necessário.

---

### 6. CONFIGURAÇÃO DE BANCO DE DADOS (Supabase)

- Criar tabelas: `profiles` (com campo `role`: user/admin), `user_progress` (grava o dia atual, `completed_at`, respostas dos diários e horários de bloqueio), `daily_contents` (armazenando textos, vídeos e checklists de cada dia) e `journal_entries`.

- Aplicar políticas RLS (Row Level Security) para garantir a segurança dos dados pessoais.

## Stack

- **TanStack Start** (SSR) + React 19 + TypeScript
- **Tailwind CSS v4** + shadcn/ui + Lucide icons + Motion
- **Supabase** (Auth com e-mail/senha e Google, Postgres com RLS)
- PWA instalável (webmanifest + Service Worker)

## Desenvolvimento

Requer [Bun](https://bun.sh).

```sh
bun install
bun run dev      # servidor de desenvolvimento
bun run build    # build de produção
bun run preview  # pré-visualiza o build
bun run lint     # eslint
bun run format   # prettier --write
```

Variáveis de ambiente do Supabase ficam em `.env` (veja `.env` de exemplo no repositório).
