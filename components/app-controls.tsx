"use client";

import { OrganizationSwitcher, UserButton, useClerk } from "@clerk/nextjs";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppControls() {
  const { openOrganizationProfile } = useClerk();

  return (
    <div className="flex items-center gap-2">
      <OrganizationSwitcher
        hidePersonal
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
      />
      <button
        type="button"
        onClick={() => openOrganizationProfile()}
        className="rounded border border-border px-2 py-1 text-[11px] text-muted hover:border-border-strong hover:text-foreground"
      >
        Invite
      </button>
      <ThemeToggle />
      <UserButton />
    </div>
  );
}
