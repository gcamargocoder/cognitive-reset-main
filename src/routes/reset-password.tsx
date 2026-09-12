import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { firstIssueMessage, resetPasswordSchema } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Método LIBERTAÇÃO" },
      {
        name: "description",
        content: "Defina uma nova senha para voltar à sua trilha de 30 dias com segurança.",
      },
      { property: "og:title", content: "Nova senha — Método LIBERTAÇÃO" },
      { property: "og:description", content: "Defina uma nova senha e retome sua trilha." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = resetPasswordSchema.safeParse({ password });
    if (!validation.success) {
      toast.error(firstIssueMessage(validation));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada.");
    navigate({ to: "/trilha", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-calm px-5 py-12">
      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-soft">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold">Definir nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma senha com pelo menos 6 caracteres.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full tap-scale" disabled={busy}>
              Salvar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
