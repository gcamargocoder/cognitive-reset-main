import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge, computeTierIgnoringFlag, type AccessTier } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: AdminDashboardPage,
});

type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  birth_date: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_paid: boolean;
  vip_courtesy_expires_at: string | null;
};

const TIER_LABELS: Record<AccessTier, string> = {
  unlimited: "Liberado",
  paid: "Pago",
  vip: "Cortesia VIP",
  trial: "Trial",
  expired: "Expirado",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [vipTarget, setVipTarget] = useState<AdminUserRow | null>(null);
  const [granting, setGranting] = useState(false);
  const [togglingFlag, setTogglingFlag] = useState(false);

  const settings = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw new Error(error.message);
      return (data ?? []) as AdminUserRow[];
    },
  });

  const rows = useMemo(() => users.data ?? [], [users.data]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const total = rows.length;
    const active24h = rows.filter(
      (r) => r.last_sign_in_at && now - new Date(r.last_sign_in_at).getTime() < DAY_MS,
    ).length;
    const trial = rows.filter(
      (r) =>
        computeTierIgnoringFlag({
          isPaid: r.is_paid,
          vipCourtesyExpiresAt: r.vip_courtesy_expires_at,
          createdAt: r.created_at,
        }) === "trial",
    ).length;
    const paid = rows.filter((r) => r.is_paid).length;
    return { total, active24h, trial, paid };
  }, [rows]);

  const togglePaywall = async (next: boolean) => {
    setTogglingFlag(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ paywall_enabled: next })
      .eq("id", true);
    setTogglingFlag(false);
    if (error) {
      toast.error("Não foi possível atualizar a configuração agora.");
      return;
    }
    toast.success(next ? "Modo Trial/Paywall ativado." : "Modo Trial/Paywall desativado.");
    queryClient.invalidateQueries({ queryKey: ["app-settings"] });
  };

  const confirmGrantVip = async () => {
    if (!vipTarget) return;
    setGranting(true);
    const { error } = await supabase.rpc("admin_grant_vip_courtesy", {
      target_user_id: vipTarget.id,
    });
    setGranting(false);
    setVipTarget(null);
    if (error) {
      toast.error("Não foi possível conceder a cortesia agora.");
      return;
    }
    toast.success(
      `Cortesia VIP de 5 dias concedida${vipTarget.full_name ? ` a ${vipTarget.full_name}` : ""}.`,
    );
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <AppShell
      title="Painel Admin"
      subtitle="Métricas, usuários e Cortesia VIP"
      action={
        <Button asChild variant="ghost" size="icon" aria-label="Voltar para o perfil">
          <Link to="/perfil">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      }
    >
      <Card className="rounded-3xl border-border/60 shadow-soft">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Modo Trial / Paywall Ativo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Desligado: tudo liberado para todos. Ligado: aplica Trial de 5 dias, Cortesia VIP e
              bloqueio do SOS/técnicas/trilha.
            </p>
          </div>
          <Switch
            checked={settings.data?.paywall_enabled ?? false}
            disabled={togglingFlag || settings.isLoading}
            onCheckedChange={togglePaywall}
          />
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { label: "Contas totais", value: metrics.total },
          { label: "Ativos (24h)", value: metrics.active24h },
          { label: "Em Trial", value: metrics.trial },
          { label: "Pagos", value: metrics.paid },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 space-y-3">
        <h2 className="text-base font-semibold">Usuários</h2>
        {users.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
        ) : (
          rows.map((row) => {
            const tier = computeTierIgnoringFlag({
              isPaid: row.is_paid,
              vipCourtesyExpiresAt: row.vip_courtesy_expires_at,
              createdAt: row.created_at,
            });
            return (
              <Card key={row.id} className="rounded-2xl border-border/60 shadow-sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.full_name?.trim() || "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{row.email ?? "—"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {TIER_LABELS[tier]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Idade: {row.birth_date ? `${calculateAge(row.birth_date)} anos` : "—"} ·
                    Cadastro: {new Date(row.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full tap-scale"
                    onClick={() => setVipTarget(row)}
                  >
                    Conceder Cortesia VIP (Acesso Completo)
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      <AlertDialog open={vipTarget !== null} onOpenChange={(next) => !next && setVipTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conceder Cortesia VIP?</AlertDialogTitle>
            <AlertDialogDescription>
              {vipTarget?.full_name || vipTarget?.email || "Este usuário"} terá acesso 100% liberado
              (técnicas, SOS e trilha) por 5 dias a partir de agora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={granting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmGrantVip();
              }}
              disabled={granting}
            >
              {granting ? "Concedendo..." : "Conceder 5 dias"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
