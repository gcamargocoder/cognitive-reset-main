import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
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
import { useExitConfirm } from "@/hooks/use-exit-confirm";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // getSession() é local (lê do storage, sem rede) e já nos dá o id pra
    // disparar a busca do perfil em PARALELO com getUser() — antes as duas
    // rodavam uma depois da outra, dobrando o tempo de tela branca no
    // carregamento inicial. getUser() continua sendo a fonte da verdade
    // pra decidir se a sessão é válida (getSession sozinho não verifica
    // com o servidor).
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) throw redirect({ to: "/auth" });

    const [{ data, error }, { data: profile }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("profiles")
        .select("full_name, birth_date")
        .eq("id", session.user.id)
        .maybeSingle(),
    ]);
    if (error || !data.user) throw redirect({ to: "/auth" });

    const complete = Boolean(profile?.full_name?.trim() && profile?.birth_date);
    const onOnboarding = location.pathname === "/onboarding/perfil";

    if (!complete && !onOnboarding) throw redirect({ to: "/onboarding/perfil" });
    if (complete && onOnboarding) throw redirect({ to: "/trilha" });

    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { open: exitOpen, confirmExit, cancelExit } = useExitConfirm(true);

  return (
    <>
      <Outlet />

      <AlertDialog open={exitOpen} onOpenChange={(next) => !next && cancelExit()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do aplicativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente sair do Método LIBERTAÇÃO?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelExit}>Não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Sim, sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
