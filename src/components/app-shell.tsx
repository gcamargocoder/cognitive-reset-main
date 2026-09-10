import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarCheck, NotebookPen, User, LifeBuoy } from "lucide-react";
import { type ReactNode, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { SosSheet } from "./sos-sheet";
import { cn } from "@/lib/utils";

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
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const [sosOpen, setSosOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-calm pb-32 no-scrollbar">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-5 py-4 backdrop-blur-lg">
        <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
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
            {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
          </motion.div>
          {action}
        </div>
      </header>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-2xl px-5 py-6"
      >
        {children}
      </motion.main>

      <motion.button
        type="button"
        onClick={() => setSosOpen(true)}
        aria-label="Abrir SOS emocional"
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.03 }}
        className="fixed bottom-28 right-5 z-30 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-sos text-sos-foreground shadow-lift"
      >
        <LifeBuoy className="h-5 w-5" strokeWidth={2.2} />
        <span className="text-[10px] font-bold leading-none tracking-wide">SOS</span>
      </motion.button>

      <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
        <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-2xl border border-border bg-background/90 p-1.5 shadow-lift backdrop-blur-lg">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <li key={to} className="relative">
                <Link
                  to={to}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium transition-colors duration-200",
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
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                  </span>
                  <span className="relative">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SosSheet open={sosOpen} onOpenChange={setSosOpen} />
    </div>
  );
}
