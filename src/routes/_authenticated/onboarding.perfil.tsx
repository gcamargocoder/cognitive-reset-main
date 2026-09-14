import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapMe } from "@/lib/progress.functions";
import { calculateAge } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/onboarding/perfil")({
  component: OnboardingPerfilPage,
});

const MIN_AGE = 0;
const MAX_AGE = 120;

function OnboardingPerfilPage() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(bootstrapMe);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Escreva seu nome para continuar.");
      return;
    }
    if (!birthDate) {
      toast.error("Escolha sua data de nascimento para continuar.");
      return;
    }
    const age = calculateAge(birthDate);
    if (birthDate > today || age < MIN_AGE || age > MAX_AGE) {
      toast.error("Verifique a data de nascimento informada.");
      return;
    }

    setBusy(true);
    try {
      await bootstrap({ data: undefined as never });
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("Sessão expirada. Entre novamente.");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name.trim(), birth_date: birthDate })
        .eq("id", auth.user.id);
      if (error) {
        toast.error("Não foi possível salvar seus dados agora. Tente novamente.");
        return;
      }
      navigate({ to: "/trilha", replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-calm px-5 py-12">
      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-soft">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold">Complete seu perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Antes de começar, precisamos do seu nome e data de nascimento. Leva menos de um minuto.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="onboarding-name">Como quer ser chamado</Label>
              <Input
                id="onboarding-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboarding-birth">Data de nascimento</Label>
              <Input
                id="onboarding-birth"
                type="date"
                max={today}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full tap-scale" disabled={busy}>
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
