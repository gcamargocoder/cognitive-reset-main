-- Flag mestra de Trial/Paywall (linha única, desligada por padrão).
CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
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
CREATE TRIGGER app_settings_touch BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Plano do usuário e cadastro obrigatório (nome já existe via full_name).
ALTER TABLE public.profiles
  ADD COLUMN is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN vip_courtesy_expires_at timestamptz,
  ADD COLUMN birth_date date;

-- A policy "profiles_update_own" já existente é por LINHA (auth.uid() = id),
-- não por coluna — sem isto, qualquer usuário autenticado poderia se
-- auto-conceder is_paid=true ou um vip_courtesy_expires_at no futuro
-- distante direto pelo cliente. Restringe por coluna: o dono só edita os
-- campos de perfil; is_paid/vip_courtesy_expires_at só mudam via a função
-- admin_grant_vip_courtesy abaixo (SECURITY DEFINER) ou pelo service role
-- (futuro webhook de pagamento), nunca por um UPDATE direto do cliente.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, birth_date) ON public.profiles TO authenticated;

-- Concede Cortesia VIP de 5 dias a um usuário — só admins podem chamar; a
-- validade é calculada aqui dentro, nunca recebida (e confiada) do cliente.
CREATE OR REPLACE FUNCTION public.admin_grant_vip_courtesy(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.profiles
  SET vip_courtesy_expires_at = now() + interval '5 days'
  WHERE id = target_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_grant_vip_courtesy(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_vip_courtesy(uuid) TO authenticated;

-- Lista de usuários para o Painel Admin — expõe last_sign_in_at (auth.users)
-- sem abrir a tabela auth.users diretamente ao cliente.
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
