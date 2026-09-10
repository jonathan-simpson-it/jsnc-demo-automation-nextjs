import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tenant context always derives from the authenticated session; a caller can
// never supply an organisation id. resolveTenant is pure (no request scope)
// so it can be integration-tested directly.
export class TenantError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

const MESSAGES: Record<string, string> = {
  unauthenticated: "Sign in to continue.",
  no_active_organization: "Select an organisation before using this workspace.",
  not_a_member: "You are not a member of the active organisation.",
};

export async function resolveTenant(userId: string, activeOrganizationId: string | null | undefined) {
  if (!activeOrganizationId) {
    throw new TenantError(409, "no_active_organization");
  }
  const membership = await prisma.member.findFirst({
    where: { userId, organizationId: activeOrganizationId },
    select: { organizationId: true, role: true },
  });
  if (!membership) {
    throw new TenantError(403, "not_a_member");
  }
  return membership;
}

export async function requireTenant() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new TenantError(401, "unauthenticated");
  }
  const membership = await resolveTenant(session.user.id, session.session.activeOrganizationId);
  return { user: session.user, session: session.session, ...membership };
}

export function tenantErrorResponse(error: unknown): Response {
  if (error instanceof TenantError) {
    return Response.json(
      { detail: { code: error.code, message: MESSAGES[error.code] ?? "Request denied." } },
      { status: error.status },
    );
  }
  throw error;
}
