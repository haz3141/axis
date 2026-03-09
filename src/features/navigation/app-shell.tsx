"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCheckIcon,
  HomeIcon,
  InboxIcon,
  SparklesIcon,
  UserCircleIcon,
  UsersIcon,
} from "lucide-react";
import { GlobalQuickAddLauncher } from "@/features/quick-add/global-quick-add";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", label: "Today", icon: HomeIcon },
  { href: "/tasks", label: "Inbox", icon: InboxIcon },
  { href: "/upcoming", label: "Upcoming", icon: ArrowRightIcon },
  { href: "/review", label: "Review", icon: CheckCheckIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/shared", label: "Shared", icon: UsersIcon },
  { href: "/quick-add", label: "Quick add", icon: SparklesIcon },
  { href: "/profile", label: "Profile", icon: UserCircleIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-50 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm focus:not-sr-only"
      >
        Skip to content
      </a>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:flex-row lg:px-8 lg:pb-4">
        <aside className="w-full shrink-0 rounded-3xl border bg-card p-4 lg:w-72">
          <div className="space-y-1 border-b border-border pb-4">
            <p className="text-sm font-medium text-muted-foreground">Axis</p>
            <h1 className="text-2xl font-semibold tracking-tight">Household planner</h1>
            <p className="text-sm text-muted-foreground">
              Tasks, recurring routines, shared ownership, and quick capture.
            </p>
          </div>

          <GlobalQuickAddLauncher />

          <nav aria-label="Primary" className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm transition-colors",
                    isActive
                      ? "border-border bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
