# Trial / Paywall / Cortesia VIP / Admin Dashboard / Perfil Completo — Design

## Contexto e objetivo

O app "Método LIBERTAÇÃO" hoje é 100% aberto para qualquer usuário autenticado.
Antes do lançamento comercial, o dono do produto fechou uma parceria com uma
terapeuta para expandir conteúdo, e quer preparar (mas **não ativar**) o
modelo de acesso comercial: Trial de 5 dias, Paywall, Cortesia VIP concedida
por um admin, e um Painel de Super Admin com métricas — agora também exigindo
que todo usuário cadastre nome e data de nascimento logo após o login, com
esses dados aparecendo no Painel Admin.

Requisito central da parte de acesso: **uma trava mestra (feature flag)**
`paywall_enabled`, hoje `false`, controlada por um admin. Enquanto `false`,
absolutamente nada muda para o usuário final — SOS, todas as técnicas e todos
os dias da trilha continuam livres, sem nenhum modal de bloqueio. Quando
alguém ligar essa chave no futuro, a hierarquia Pago > Cortesia VIP > Trial >
Expirado passa a valer automaticamente, sem precisar de novo deploy.

Este spec cobre 5 partes, decompostas por acoplamento:

- **A. Modelo de acesso + gating** (flag, colunas em `profiles`, hook de
  acesso, pontos de bloqueio em SOS/Biblioteca/Trilha, modal de paywall).
- **B. Checkout + webhook Mercado Pago** (preparados, inertes sem chaves).
- **C. Painel Admin** (toggle da flag, métricas, lista de usuários com nome e
  idade, conceder Cortesia VIP).
- **D. Perfil completo** (nome, data de nascimento e foto editáveis a
  qualquer momento na tela de Perfil).
- **E. Cadastro obrigatório logo após o login** (bloqueia o acesso a
  qualquer funcionalidade até nome e data de nascimento estarem preenchidos).

Fora de escopo nesta rodada: chaves reais do Mercado Pago, deploy da Edge
Function, qualquer teste de pagamento de ponta a ponta, paginação da lista de
usuários no admin (assume-se uma base pequena por enquanto).

## A. Modelo de acesso e gating

### A.1 Schema

Nova migração Supabase:

```sql
-- Flag mestra (linha única, id fixo)
CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true), -- garante 1 linha só
  paywall_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (id, paywall_enabled) VALUES (true, false);

GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT UPDATE ON public.app_settings TO authenticated;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_read_all" ON public.app_settings FOR SELECT
  TO authenticated, anon USING (true);
CREATE POLICY "app_settings_admin_write" ON public.app_settings FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Plano do usuário
ALTER TABLE public.profiles
  ADD COLUMN is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN vip_courtesy_expires_at timestamptz;
```

O início do trial é o `profiles.created_at` já existente (criado pelo
`bootstrap_me()` no primeiro carregamento autenticado) — não precisa de
coluna nova.

### A.2 Cálculo do nível de acesso

Função pura, sem I/O, em `src/lib/access.ts`:

```ts
export type AccessTier = "unlimited" | "paid" | "vip" | "trial" | "expired";

export type AccessProfile = {
  paywallEnabled: boolean;
  isPaid: boolean;
  vipCourtesyExpiresAt: string | null;
  createdAt: string;
};

const TRIAL_DAYS = 5;

export function computeAccessTier(p: AccessProfile): AccessTier {
  if (!p.paywallEnabled) return "unlimited";
  return computeTierIgnoringFlag(p);
}

/**
 * Ignora paywallEnabled — usado pelo painel Admin para mostrar "quantos
 * usuários cairiam em cada faixa se a trava fosse ligada agora", mesmo
 * enquanto ela está desligada. Nunca usar para decidir bloqueio real.
 */
export function computeTierIgnoringFlag(p: Omit<AccessProfile, "paywallEnabled">): Exclude<AccessTier, "unlimited"> {
  if (p.isPaid) return "paid";
  if (p.vipCourtesyExpiresAt && new Date(p.vipCourtesyExpiresAt) > new Date()) return "vip";
  const trialEnds = new Date(p.createdAt).getTime() + TRIAL_DAYS * 86_400_000;
  if (Date.now() < trialEnds) return "trial";
  return "expired";
}

export function isSosUnlocked(tier: AccessTier) {
  return tier === "unlimited" || tier === "paid" || tier === "vip";
}

/** positionInSession: índice 0-based da técnica dentro da sessão (Ansiedade, Pânico...). */
export function isTechniqueUnlocked(tier: AccessTier, positionInSession: number) {
  if (tier === "unlimited" || tier === "paid" || tier === "vip") return true;
  if (tier === "trial") return positionInSession === 0;
  return false;
}

export function isTrilhaDayUnlocked(tier: AccessTier, day: number) {
  if (tier === "unlimited" || tier === "paid" || tier === "vip") return true;
  if (tier === "trial") return day <= 2;
  return false;
}
```

`vip` expira sozinho: não existe job de reversão, a expiração é só o efeito
de `computeAccessTier` parar de retornar `"vip"` quando `now()` passa da
data — na próxima vez que o app calcular o tier, a conta já reflete
`trial`/`expired` conforme o caso.

### A.3 Hook `useAccessStatus()`

Em `src/lib/use-access-status.ts`, um hook React Query que:

1. Busca `app_settings.paywall_enabled` (queryKey `["app-settings"]`).
2. Busca `profiles.{is_paid, vip_courtesy_expires_at, created_at}` do usuário
   atual (queryKey `["profile-access"]`, pode reaproveitar dado já buscado em
   `perfil.tsx` mais tarde, mas por ora é sua própria query leve).
3. Retorna `{ tier, loading, isSosUnlocked, isTechniqueUnlocked, isTrilhaDayUnlocked }`
   usando as funções puras de `access.ts`.

Enquanto `loading` for `true` (ainda não sabemos o tier), os componentes que
usam o hook tratam como se estivesse liberado (`unlimited`) para não piscar
um cadeado incorretamente antes da resposta — dado que hoje em dia a flag
está `false` isso é seguro; quando a flag for ligada, o `loading` é breve
(cache do React Query já aquecido na maioria das navegações).

### A.4 Pontos de bloqueio

- **`app-shell.tsx`**: botão SOS chama `openSos()` só se
  `isSosUnlocked(tier)`; caso contrário chama `openPaywall()` (novo contexto
  `PaywallContext`, mesmo padrão do `SosContext` já existente).
- **`biblioteca.index.tsx`**: cada técnica na lista recebe `locked =
  !isTechniqueUnlocked(tier, index)`; se travada, mostra ícone de cadeado no
  lugar do número e o `onClick`/`Link` vira `openPaywall()` em vez de
  navegar.
- **`biblioteca.$slug.tsx`**: recalcula a posição da técnica dentro da sessão
  (via `findTechniqueSession` + índice) e, se travada, mostra um estado de
  bloqueio na página (em vez do conteúdo) com o mesmo CTA do modal — cobre
  acesso direto por URL.
- **`trilha.index.tsx`**: `available` passa a exigir também
  `isTrilhaDayUnlocked(tier, day.day)`; dias bloqueados por plano (mas
  liberados pela trava de 24h) mostram cadeado + `openPaywall()` em vez do
  contador de tempo. **A lógica de 24h (`unlock_at`, `current_day`,
  `completed_days`) não é alterada** — é só mais uma condição de "disponível".
- **`trilha.$day.tsx`**: mesmo guard na entrada da página — se o dia não é
  desbloqueado pelo plano, mostra bloqueio em vez do conteúdo do dia.

### A.5 Modal de Paywall

Componente `src/components/paywall-dialog.tsx`, um `AlertDialog` controlado
por um novo `PaywallContext` (exposto pelo `AppShell`, ao lado do
`SosContext`), com o texto fixo do pedido e botão "Desbloquear Acesso
Completo" → `navigate({ to: "/checkout" })`.

## B. Checkout + webhook Mercado Pago (preparados, inertes)

- **Rota `/_authenticated/checkout.tsx`**: mostra o preço lido de
  `import.meta.env.VITE_MERCADOPAGO_PRICE_LABEL` (ex.: `"R$ 49,90"`); se a
  env var não estiver definida, mostra "Em breve — valor a definir" e
  desabilita o botão de pagar.
- **Server function `createCheckoutPreference`** (`src/lib/payment.functions.ts`):
  chama a API de Preferences do Mercado Pago
  (`POST https://api.mercadopago.com/checkout/preferences`) usando
  `process.env.MERCADOPAGO_ACCESS_TOKEN`, com `external_reference =
  userId` e `notification_url` apontando para a Edge Function (B.2). Se a env
  var não estiver setada, lança um erro amigável ("Pagamentos ainda não
  configurados") capturado pela UI do checkout — não quebra o build nem a
  navegação.
- **Edge Function `supabase/functions/mercadopago-webhook/index.ts`**:
  recebe a notificação do Mercado Pago, valida a assinatura
  (`MERCADOPAGO_WEBHOOK_SECRET`), busca o pagamento via API
  (`MERCADOPAGO_ACCESS_TOKEN`), e se `status === "approved"` atualiza
  `profiles.is_paid = true` para o `external_reference` (userId), usando a
  `SUPABASE_SERVICE_ROLE_KEY` já disponível no ambiente de Edge Functions.
  Escrita neste spec, mas **o deploy da function e a configuração dos
  secrets no projeto Supabase ficam para quando a integração for ativada** —
  não posso fazer esse deploy por aqui.

Nenhuma dessas peças interfere no fluxo atual: sem as env vars, o checkout
mostra "em breve" e a function não é chamada por ninguém (o Mercado Pago só
dispara o webhook para preferências criadas de verdade).

## C. Painel Admin

Reaproveita o role `admin` já existente (`has_role(uid,'admin')`).

### C.1 Função SQL `admin_list_users()`

```sql
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid, email text, full_name text, birth_date date, created_at timestamptz,
  last_sign_in_at timestamptz, is_paid boolean, vip_courtesy_expires_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.email, p.full_name, p.birth_date, p.created_at, u.last_sign_in_at,
         p.is_paid, p.vip_courtesy_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
```

`birth_date` vem cru (o admin dashboard calcula a idade em anos no cliente,
com a mesma função `calculateAge` usada no Perfil e no onboarding — ver D.2 —
para não duplicar a matemática de idade em SQL e em TS).

Se quem chama não é admin, o `WHERE` não casa nenhuma linha (retorna vazio)
em vez de erro — suficiente aqui pois a rota já é guardada por `beforeLoad`.

### C.2 Server function `grantVipCourtesy`

Em `progress.functions.ts` (ou novo `admin.functions.ts`): recebe `userId`,
confere que quem chama é admin (`requireSupabaseAuth` + checagem de role),
faz `UPDATE profiles SET vip_courtesy_expires_at = now() + interval '5 days'
WHERE id = userId`.

### C.3 Server function `setPaywallEnabled`

Recebe `enabled: boolean`, confere admin, `UPDATE app_settings SET
paywall_enabled = $1`.

### C.4 UI

Nova rota `src/routes/_authenticated/admin.dashboard.tsx` (mesmo guard
`beforeLoad` de `/admin`), com:

- Toggle "Modo Trial / Paywall Ativo" (switch já existente em
  `components/ui/switch.tsx`).
- 4 cards: Total de contas (`count(*)`), Ativos nas últimas 24h
  (`last_sign_in_at > now() - 24h`), Trial (`computeTierIgnoringFlag`
  aplicado a cada linha — métrica informativa "quantos cairiam em trial se
  eu ligasse agora", independente do estado atual da flag), Pago (`is_paid =
  true`). Todos calculados client-side a partir do array retornado por
  `admin_list_users()`.
- Lista de usuários (nome, idade calculada a partir de `birth_date`, email,
  badge do tier calculado, data de criação) com botão "Conceder Cortesia VIP
  (5 dias)" por linha, com confirmação simples (mesmo padrão dos outros
  dialogs de ação no app). Usuário sem `birth_date`/`full_name` ainda (não
  completou o cadastro obrigatório — ver E) mostra "—" no lugar da idade/nome
  em vez de quebrar.
- Link cruzado com o `/admin` de conteúdo existente (ambos continuam
  existindo; o de conteúdo não muda).

## D. Perfil completo (nome, data de nascimento, foto)

### D.1 Schema

```sql
ALTER TABLE public.profiles ADD COLUMN birth_date date;

-- Storage para avatares
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  to public using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatars_owner_update" on storage.objects for update
  to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatars_owner_delete" on storage.objects for delete
  to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
```

Arquivos são salvos em `avatars/{user_id}/<nome>`, então a política de dono
usa o primeiro segmento do caminho — cada usuário só escreve na própria
pasta; leitura é pública (é uma foto de perfil, não um dado sensível).

### D.2 Helper de idade — `src/lib/age.ts`

```ts
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}
```

Usado no Perfil (mostrar idade ao lado da data), no onboarding obrigatório
(E) e no Painel Admin (C.4) — uma única fonte de verdade para o cálculo.

### D.3 UI em `perfil.tsx`

- Campo "Data de nascimento" (`<input type="date">`, `max` = hoje) ao lado do
  campo de nome já existente; mostra a idade calculada como texto de apoio.
- Upload de avatar: input de arquivo (aceita imagem, valida tamanho/tipo
  reaproveitando `src/lib/file-validation.ts` se aplicável) → upload via
  `supabase.storage.from("avatars").upload(...)` → `getPublicUrl` → `UPDATE
  profiles SET avatar_url = <url>`. Mostra preview/avatar atual com
  `components/ui/avatar.tsx` (já existe no design system).
- Nome e data de nascimento continuam editáveis livremente aqui depois do
  cadastro obrigatório (E) — esta tela é o lugar de "editar meus dados a
  qualquer momento".

## E. Cadastro obrigatório logo após o login

### E.1 Regra

Todo usuário autenticado sem `full_name` **e** `birth_date` preenchidos é
redirecionado para uma tela obrigatória antes de acessar qualquer outra parte
do app — Trilha, Biblioteca, Diário, Perfil, SOS, tudo. Vale tanto para
contas novas quanto para contas já existentes que nunca preencheram esses
dados (checagem por estado do perfil, não por "é a primeira vez que loga").

### E.2 Onde a checagem acontece

Em `src/routes/_authenticated/route.tsx`, dentro do `beforeLoad` que já
existe (hoje só confere sessão). Depois de confirmar a sessão, busca
`profiles.{full_name, birth_date}` do usuário:

```ts
beforeLoad: async ({ location }) => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, birth_date")
    .eq("id", data.user.id)
    .maybeSingle();
  const complete = Boolean(profile?.full_name?.trim() && profile?.birth_date);
  const onOnboarding = location.pathname === "/onboarding/perfil";

  if (!complete && !onOnboarding) throw redirect({ to: "/onboarding/perfil" });
  if (complete && onOnboarding) throw redirect({ to: "/trilha" });

  return { user: data.user };
},
```

Um perfil que ainda nem existe (usuário logando pela 1ª vez, antes do
`bootstrap_me()` rodar) conta como incompleto — cai naturalmente no
onboarding, sem caso especial.

### E.3 Tela `src/routes/_authenticated/onboarding.perfil.tsx`

Tela cheia, centralizada (mesmo estilo do `/auth`), **sem** `AppShell` (sem
menu inferior — o usuário não deve conseguir navegar para outro lugar antes
de terminar). Campos: nome e data de nascimento, botão "Continuar". Ao
enviar: chama `bootstrapMe()` (garante que a linha em `profiles` existe,
idempotente) e então `UPDATE profiles SET full_name = ?, birth_date = ?`,
depois `navigate({ to: "/trilha", replace: true })`.

Validação: nome não vazio; data de nascimento não pode ser no futuro nem
implicar idade acima de ~120 anos (mesma checagem de sanidade, sem exigir
idade mínima específica — quem decide se o público é adequado é o dono do
produto, não uma regra de negócio aqui).

## Testes e verificação

Sem suíte de testes automatizados no projeto (confirmado em rodada
anterior). Verificação via `tsc --noEmit`, `eslint`, `bun run build`, e
teste manual no dev server com a flag desligada (comportamento atual
preservado) e ligada manualmente no banco (comportamento de trial/paywall
correto), dentro do possível sem uma conta de usuário real logada neste
ambiente.

## Riscos / limitações conhecidas

- Conteúdo de técnicas (`library.ts`) é estático no bundle do cliente; o
  bloqueio de técnicas é client-side (mesmo nível de rigor já aceito hoje
  para a trava de 24h da trilha) — não é DRM, é UX de paywall.
- Lista de usuários sem paginação; aceitável para o volume atual, deve ser
  revisitado se a base crescer muito.
- Nenhum teste de pagamento real é possível sem as chaves de produção.
- Não há Supabase CLI disponível neste ambiente: as migrações novas
  (`app_settings`, colunas de `profiles`, bucket `avatars`,
  `admin_list_users()`) serão escritas em `supabase/migrations/`, mas
  **precisam ser aplicadas ao projeto Supabase pelo usuário** (painel do
  Supabase, `supabase db push`, ou o pipeline de deploy do Lovable Cloud, se
  ele já sincronizar migrações automaticamente) — o mesmo já valia para as
  migrações de sessões anteriores desta conversa.
