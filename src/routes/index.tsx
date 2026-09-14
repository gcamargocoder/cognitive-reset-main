import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Share, Smartphone, MoreVertical, Download, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Método LIBERTAÇÃO — cuide da ansiedade em 30 dias" },
      {
        name: "description",
        content:
          "Programa guiado de 30 dias com técnicas de neurociência e psicologia cognitiva para ansiedade, pânico e depressão. Trilha diária, SOS emocional e diário de evolução.",
      },
      { property: "og:title", content: "Método LIBERTAÇÃO — cuide da ansiedade em 30 dias" },
      {
        property: "og:description",
        content:
          "Trilha de 30 dias, 18 técnicas guiadas e SOS emocional para atravessar crises de ansiedade e pânico.",
      },
    ],
  }),
  component: Landing,
});

const SKIP_KEY = "pwa-onboarding-skipped";

const IOS_STEPS = [
  {
    label: "Toque no ícone de Compartilhar",
    detail: "É o quadrado com uma seta para cima, na barra do Safari.",
  },
  {
    label: 'Selecione "Adicionar à Tela de Início"',
    detail: "Role a lista de opções para baixo até encontrar essa ação.",
  },
  {
    label: 'Toque em "Adicionar"',
    detail: "No canto superior direito, para confirmar.",
  },
];

const ANDROID_STEPS = [
  {
    label: "Toque nos três pontinhos (⋮)",
    detail: "No canto superior direito do navegador.",
  },
  {
    label: 'Selecione "Adicionar à tela inicial" ou "Instalar aplicativo"',
    detail: "O texto exato pode variar um pouco conforme a versão do navegador.",
  },
  {
    label: "Confirme a instalação",
    detail: 'Toque em "Instalar" ou "Adicionar" quando for perguntado.',
  },
];

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { canInstall, isIOS, isAndroid, isStandalone, promptInstall } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);
  const [skipped] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(SKIP_KEY) === "1",
  );

  const bypassOnboarding = isStandalone || skipped;

  useEffect(() => {
    if (!loading && session) navigate({ to: "/trilha", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!loading && !session && bypassOnboarding) {
      navigate({ to: "/auth", replace: true });
    }
  }, [loading, session, bypassOnboarding, navigate]);

  if (loading || session || bypassOnboarding) return null;

  const goToAuth = () => navigate({ to: "/auth" });

  const installNow = async () => {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
      goToAuth();
    }
  };

  const skipInstall = () => {
    try {
      localStorage.setItem(SKIP_KEY, "1");
    } catch {
      // localStorage indisponível (modo privado); só não lembra na próxima visita.
    }
    goToAuth();
  };

  const steps = isIOS ? IOS_STEPS : ANDROID_STEPS;
  const platformLabel = isIOS
    ? "Instalar no iPhone (Safari)"
    : isAndroid
      ? "Instalar no Android"
      : "Instalar o aplicativo";

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-calm px-5 py-12">
      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-soft">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Smartphone className="h-3.5 w-3.5" /> Método LIBERTAÇÃO
            </span>
            <h1 className="mt-4 text-2xl font-semibold leading-tight sm:text-[1.75rem]">
              Leve o app no seu bolso
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
              Instale na tela inicial do seu celular para abrir mais rápido, receber lembretes e
              usar o SOS mesmo offline.
            </p>

            {canInstall ? (
              <div className="mt-6">
                <Button
                  size="lg"
                  className="tap-scale h-14 w-full text-base"
                  disabled={installing}
                  onClick={installNow}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Instalar Aplicativo
                </Button>
              </div>
            ) : (
              <div className="mt-6">
                {isIOS ? (
                  <Share className="h-7 w-7 text-primary" />
                ) : (
                  <MoreVertical className="h-7 w-7 text-primary" />
                )}
                <p className="mt-2 text-sm font-semibold text-foreground">{platformLabel}</p>

                <ol className="mt-4 space-y-4">
                  {steps.map((step, i) => (
                    <li key={step.label} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold leading-snug text-foreground">
                          {step.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">{step.detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>

                <Button
                  size="lg"
                  className="tap-scale mt-6 h-14 w-full text-base"
                  onClick={goToAuth}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Entender e Continuar para o App
                </Button>
              </div>
            )}

            <button
              type="button"
              className="mt-5 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={skipInstall}
            >
              Continuar no navegador sem instalar
            </button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
