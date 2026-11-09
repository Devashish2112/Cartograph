import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { getCurrentOrganization } from "@/lib/auth";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await auth.protect();
  const organization = await getCurrentOrganization();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
          workspace
        </p>
        <h1 className="text-lg font-semibold tracking-tight">
          {organization?.name ?? "Organization"}
        </h1>
        <p className="font-mono text-xs text-muted">
          {organization?.slug ?? organization?.id ?? "no active organization"}
          {organization?.role ? ` · ${organization.role}` : null}
        </p>
      </header>

      <section className="rounded border border-border bg-surface p-4">
        <p className="text-sm text-muted">
          This workspace is the shell later phases render inside.
        </p>
      </section>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6"
      aria-hidden
    >
      <div className="flex flex-col gap-2">
        <div className="h-3 w-20 rounded bg-surface-muted" />
        <div className="h-5 w-48 rounded bg-surface-muted" />
        <div className="h-3 w-32 rounded bg-surface-muted" />
      </div>
      <div className="h-24 rounded border border-border bg-surface" />
    </div>
  );
}
