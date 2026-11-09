import Link from "next/link";
import type { ReactNode } from "react";

import { AppControls } from "@/components/app-controls";

export function AppShell({
  children,
  organization,
}: {
  children: ReactNode;
  organization: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
        <Link
          href="/dashboard"
          className="font-mono text-sm font-semibold tracking-tight text-foreground"
        >
          cartograph
        </Link>
        <span className="text-faint" aria-hidden>
          /
        </span>
        <div className="min-w-0">{organization}</div>
        <div className="ml-auto flex items-center gap-2">
          <AppControls />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
