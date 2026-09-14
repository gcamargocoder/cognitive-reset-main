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
