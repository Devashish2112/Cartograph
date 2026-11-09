import { getCurrentOrganization } from "@/lib/auth";

export async function OrgName() {
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <span className="font-mono text-xs text-faint">no organization</span>
    );
  }

  return (
    <span
      className="block truncate font-mono text-xs text-muted"
      title={organization.id}
    >
      {organization.name ?? organization.slug ?? organization.id}
    </span>
  );
}

export function OrgNameFallback() {
  return (
    <span
      className="block h-3 w-24 rounded bg-surface-muted"
      aria-hidden
    />
  );
}
