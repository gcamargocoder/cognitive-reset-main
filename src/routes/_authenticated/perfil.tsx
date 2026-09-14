import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { calculateAge } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sem sessão");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id);
      setName((current) => current || data?.full_name || "");
      setBirthDate((current) => current || data?.birth_date || "");
      return {
        email: auth.user.email ?? data?.email ?? "",
        fullName: data?.full_name ?? "",
        birthDate: data?.birth_date ?? null,
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      };
    },
  });

  const save = async () => {
    if (!name.trim()) {
      toast.error("Escreva seu nome.");
      return;
    }
    if (birthDate && birthDate > today) {
      toast.error("A data de nascimento não pode ser no futuro.");
      return;
    }
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setBusy(false);
      toast.error("Sessão expirada.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), birth_date: birthDate || null })
      .eq("id", auth.user.id);
    setBusy(false);
    if (error) {
      console.error("[perfil] Falha ao salvar profiles.full_name/birth_date:", error);
      toast.error(`Não foi possível salvar: ${error.message}`);
      return;
    }
    toast.success("Perfil atualizado.");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell title="Perfil" subtitle="Sua conta e preferências">
      <div className="space-y-4">
        <Card className="rounded-3xl border-border/60 shadow-soft">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={profile.data?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Como quer ser chamado</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth-date">Data de nascimento</Label>
              <Input
                id="birth-date"
                type="date"
                max={today}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              {birthDate ? (
                <p className="text-xs text-muted-foreground">{calculateAge(birthDate)} anos</p>
              ) : null}
            </div>
            <Button className="w-full tap-scale" onClick={save} disabled={busy}>
              Salvar
            </Button>
          </CardContent>
        </Card>

        {profile.data?.isAdmin ? (
          <Card className="rounded-3xl border-border/60 shadow-soft">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">Você tem acesso administrativo.</p>
              <Button asChild variant="outline" className="w-full tap-scale">
                <Link to="/admin/dashboard">Painel Admin (métricas e usuários)</Link>
              </Button>
              <Button asChild variant="outline" className="w-full tap-scale">
                <Link to="/admin">Conteúdo da trilha de 30 dias</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-3xl border-border/60 shadow-soft">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              Em risco imediato, ligue 188 (CVV) ou procure emergência. Este app é apoio, não
              substitui tratamento.
            </p>
            <Button variant="outline" className="w-full tap-scale" onClick={signOut}>
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
