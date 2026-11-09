import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { OrgName, OrgNameFallback } from "@/components/org-name";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppShell
      organization={
        <Suspense fallback={<OrgNameFallback />}>
          <OrgName />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
