import { auth } from "@clerk/nextjs/server";

export type CurrentOrganization = {
  id: string;
  name: string | null;
  slug: string | null;
  role: string | null;
};

/**
 * Reads the active organization from the session token. No Clerk API call is
 * made: the id, slug, role and name are already on the request.
 */
export async function getCurrentOrganization(): Promise<CurrentOrganization | null> {
  const { orgId, orgSlug, orgRole, sessionClaims } = await auth();

  if (!orgId) {
    return null;
  }

  return {
    id: orgId,
    name:
      typeof sessionClaims.org_name === "string"
        ? sessionClaims.org_name
        : null,
    slug: orgSlug ?? null,
    role: orgRole ?? null,
  };
}
