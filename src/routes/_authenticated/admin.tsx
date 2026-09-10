import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(1);
  const [title, setTitle] = useState("");
  const [technique, setTechnique] = useState("");
  const [science, setScience] = useState("");
  const [quote, setQuote] = useState("");
  const [busy, setBusy] = useState(false);

  const access = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id);
      return (data ?? []).some((r) => r.role === "admin");
    },
  });

  useEffect(() => {
    if (access.isSuccess && access.data === false) {
      toast.error("Área restrita a administradores.");
      navigate({ to: "/trilha", replace: true });
    }
  }, [access.isSuccess, access.data, navigate]);

  const days = useQuery({
    enabled: access.data === true,
    queryKey: ["daily-contents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_contents")
        .select("day, week, title, technique, science, quote")
        .order("day");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const current = days.data?.find((d) => d.day === selected);

  useEffect(() => {
    if (!current) return;
    setTitle(current.title);
    setTechnique(current.technique);
    setScience(current.science);
    setQuote(current.quote ?? "");
  }, [current?.day]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("daily_contents")
      .update({ title, technique, science, quote })
      .eq("day", selected);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Dia ${selected} atualizado.`);
    queryClient.invalidateQueries({ queryKey: ["daily-contents"] });
  };

  if (access.data !== true) {
    return (
      <AppShell title="Administração">
        <p className="text-sm text-muted-foreground">Verificando permissões…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Administração" subtitle="Conteúdo da trilha de 30 dias">
      <div className="space-y-4">
        <div className="grid grid-cols-6 gap-2">
          {(days.data ?? []).map((d) => (
            <button
              key={d.day}
              type="button"
              onClick={() => setSelected(d.day)}
              className={
                d.day === selected
                  ? "rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground"
                  : "rounded-xl bg-card py-2 text-sm text-muted-foreground shadow-soft"
              }
            >
              {d.day}
            </button>
          ))}
        </div>

        <Card className="rounded-3xl border-border/60 shadow-soft">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technique">Técnica</Label>
              <Input
                id="technique"
                value={technique}
                onChange={(e) => setTechnique(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="science">Ciência</Label>
              <Textarea
                id="science"
                rows={5}
                value={science}
                onChange={(e) => setScience(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote">Frase do dia</Label>
              <Input id="quote" value={quote} onChange={(e) => setQuote(e.target.value)} />
            </div>
            <Button className="w-full tap-scale" onClick={save} disabled={busy}>
              Salvar dia {selected}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
