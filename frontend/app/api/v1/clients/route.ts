import { prisma } from "@/lib/prisma";
import { requireTenant, tenantErrorResponse } from "@/lib/tenant";

// Organisation-scoped clients endpoint. Establishes the pattern for every
// tenant-owned resource: organisation comes from the session (never from the
// request), queries are filtered by it, and unique constraints are org-scoped.

export async function GET() {
  try {
    const { organizationId } = await requireTenant();
    const clients = await prisma.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    });
    return Response.json({ clients });
  } catch (error) {
    return tenantErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireTenant();
    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 120) {
      return Response.json(
        { detail: { code: "invalid_name", message: "A client name of 1-120 characters is required." } },
        { status: 400 },
      );
    }
    try {
      const client = await prisma.client.create({
        data: { organizationId, name },
        select: { id: true, name: true, createdAt: true },
      });
      return Response.json({ client }, { status: 201 });
    } catch (error) {
      if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
        return Response.json(
          { detail: { code: "client_name_taken", message: "A client with this name already exists." } },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    return tenantErrorResponse(error);
  }
}
