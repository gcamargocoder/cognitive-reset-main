import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
    const isAdmin = (data ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/trilha" });
  },
  component: () => <Outlet />,
});
