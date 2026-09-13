import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarCheck, NotebookPen, User, LifeBuoy } from "lucide-react";
import { type ReactNode, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { SosSheet } from "./sos-sheet";
import { DonateDialog } from "./donate-dialog";
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
import { cn } from "@/lib/utils";
import { SosContext, type SosMode } from "@/lib/sos-context";
import { useExitConfirm } from "@/hooks/use-exit-confirm";

const items = [
  { to: "/trilha", label: "Trilha", icon: CalendarCheck },
  { to: "/biblioteca", label: "Técnicas", icon: BookOpen },
  { to: "/diario", label: "Diário", icon: NotebookPen },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
  action,
  confirmExitOnBack = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  /** Mostra confirmação antes de sair do app ao voltar (use só na tela inicial). */
  confirmExitOnBack?: boolean;
}) {
  const [sosOpen, setSosOpen] = useState(false);
  const [sosMode, setSosMode] = useState<SosMode | undefined>(undefined);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open: exitOpen, confirmExit, cancelExit } = useExitConfirm(confirmExitOnBack);

  const openSos = (mode?: SosMode) => {
    setSosMode(mode);
    setSosOpen(true);
  };

  const renderItem = ({ to, label, icon: Icon }: (typeof items)[number]) => {
    const active = pathname.startsWith(to);
    return (
      <li key={to} className="relative">
        <Link
          to={to}
          className={cn(
            "relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[9px] font-medium transition-colors duration-200 sm:text-[10px]",
            active ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          <AnimatePresence initial={false}>
            {active ? (
              <motion.span
                layoutId="nav-pill"
                aria-hidden
                className="absolute inset-0 rounded-xl bg-primary"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
          </AnimatePresence>
          <span className="relative">
            <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
          </span>
          <span className="relative">{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <SosContext.Provider value={{ open: openSos }}>
      <div className="relative min-h-screen overflow-x-hidden bg-calm pb-[calc(3.75rem+env(safe-area-inset-bottom))] no-scrollbar">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-lg">
          <div className="mx-auto grid max-w-2xl grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            {action}
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              <h1 className="truncate text-[1.4rem] font-semibold leading-tight tracking-tight sm:text-2xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </motion.div>
          </div>
        </header>

        <div className="fixed right-4 top-[calc(1rem+env(safe-area-inset-top))] z-30">
          <DonateDialog />
        </div>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-2xl px-5 py-6"
        >
          {children}
        </motion.main>

        <nav className="fixed inset-x-0 bottom-0 z-20 w-full border-t border-border bg-background/95 backdrop-blur-lg">
          <ul className="mx-auto grid w-full max-w-2xl grid-cols-5 items-stretch gap-1 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 sm:gap-2">
            {items.slice(0, 2).map(renderItem)}
            <li className="relative">
              <motion.button
                type="button"
                onClick={() => openSos()}
                aria-label="Abrir SOS emocional"
                whileTap={{ scale: 0.94 }}
                className="sos-pulse relative flex w-full flex-col items-center gap-0.5 rounded-xl bg-sos px-2 py-1.5 text-[9px] font-bold tracking-wide text-sos-foreground sm:text-[10px]"
              >
                <LifeBuoy className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
                <span>SOS</span>
              </motion.button>
            </li>
            {items.slice(2).map(renderItem)}
          </ul>
        </nav>

        <SosSheet open={sosOpen} onOpenChange={setSosOpen} initialMode={sosMode} />

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
      </div>
    </SosContext.Provider>
  );
}
