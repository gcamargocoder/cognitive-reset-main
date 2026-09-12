import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { emailSchema, firstIssueMessage, signInSchema, signUpSchema } from "@/lib/validation";

const authSearchSchema = z.object({
  mode: z.enum(["in", "up"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — Método LIBERTAÇÃO" },
      {
        name: "description",
        content:
          "Acesse sua conta do Método LIBERTAÇÃO para continuar a trilha de 30 dias e o seu diário.",
      },
      { property: "og:title", content: "Entrar — Método LIBERTAÇÃO" },
      {
        property: "og:description",
        content: "Acesse sua conta e continue a trilha de 30 dias.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">(initialMode ?? "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/trilha", replace: true });
  }, [loading, session, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation =
      mode === "up"
        ? signUpSchema.safeParse({ name, email, password })
        : signInSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(firstIssueMessage(validation));
      return;
    }

    setBusy(true);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        setSent(true);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) toast.error("E-mail ou senha incorretos.");
    }
  };

  const google = async () => {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch {
      toast.error("Não foi possível abrir o login do Google.");
    }
  };

  const reset = async () => {
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(firstIssueMessage(validation));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Enviamos um link de redefinição para o seu e-mail.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-calm px-5 py-12">
      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-soft">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold">Método LIBERTAÇÃO</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "in"
              ? "Entre para continuar sua trilha."
              : "Crie sua conta e comece o Dia 1."}
          </p>

          {sent ? (
            <div className="mt-6 rounded-2xl bg-primary/10 p-4 text-sm text-foreground">
              Confira seu e-mail para confirmar a conta. Depois volte aqui e entre normalmente.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "up" ? (
                <div className="space-y-2">
                  <Label htmlFor="name">Como quer ser chamado</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full tap-scale" disabled={busy}>
                {mode === "in" ? "Entrar" : "Criar conta"}
              </Button>
            </form>
          )}

          <Button variant="outline" className="mt-3 w-full tap-scale" onClick={google}>
            Continuar com Google
          </Button>

          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setSent(false);
              }}
            >
              {mode === "in" ? "Não tenho conta — quero criar" : "Já tenho conta — quero entrar"}
            </button>
            {mode === "in" ? (
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline"
                onClick={reset}
              >
                Esqueci minha senha
              </button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
