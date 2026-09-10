import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveTenant, TenantError } from "@/lib/tenant";

// Integration tests against a disposable PostgreSQL database (payo_test).
// They drive the real Better Auth HTTP handler: magic link -> session cookie
// -> organisation create -> invite -> accept, plus tenant isolation queries.

const BASE = "http://localhost:3000";
const ORIGIN = { origin: BASE };

async function resetDb() {
  await prisma.client.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.member.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

async function magicLinkToken(email: string): Promise<string> {
  const result = await auth.api.signInMagicLink({
    body: { email, name: email.split("@")[0] },
    headers: new Headers(ORIGIN),
  });
  expect(result.status).toBe(true);
  const row = await prisma.verification.findFirst({
    where: { value: { contains: email } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) throw new Error(`no verification row for ${email}`);
  return row.identifier;
}

type Session = { cookie: string; userId: string };

async function signIn(email: string): Promise<Session> {
  const token = await magicLinkToken(email);
  const response = await auth.handler(
    new Request(
      `${BASE}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&callbackURL=/`,
      { method: "GET", headers: ORIGIN },
    ),
  );
  const cookies = response.headers.getSetCookie();
  const sessionCookie = cookies.find((c) => c.startsWith("better-auth.session_token="));
  if (!sessionCookie) {
    throw new Error(`magic link verify did not set a session cookie (status ${response.status})`);
  }
  const cookie = sessionCookie.split(";")[0];
  const session = await auth.api.getSession({ headers: new Headers({ cookie, ...ORIGIN }) });
  if (!session) throw new Error("no session after verify");
  return { cookie, userId: session.user.id };
}

function headers(session: Session): Headers {
  return new Headers({ cookie: session.cookie, ...ORIGIN });
}

async function createOrg(session: Session, slug: string) {
  const org = await auth.api.createOrganization({
    body: { name: `Org ${slug}`, slug },
    headers: headers(session),
  });
  if (!org) throw new Error("organisation was not created");
  return org;
}

beforeEach(resetDb);

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("magic link authentication", () => {
  test("a magic link signs the user in and marks email verified", async () => {
    const { userId } = await signIn("owner@example.com");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.email).toBe("owner@example.com");
    expect(user.emailVerified).toBe(true);
    const sessions = await prisma.session.count({ where: { userId } });
    expect(sessions).toBeGreaterThan(0);
  });

  test("a magic link token cannot be used twice", async () => {
    const token = await magicLinkToken("single-use@example.com");
    const first = await auth.handler(
      new Request(`${BASE}/api/auth/magic-link/verify?token=${token}&callbackURL=/`, {
        method: "GET",
        headers: ORIGIN,
      }),
    );
    expect(first.status).toBeLessThan(400);
    const second = await auth.handler(
      new Request(`${BASE}/api/auth/magic-link/verify?token=${token}&callbackURL=/`, {
        method: "GET",
        headers: ORIGIN,
      }),
    );
    // Replays redirect with an error instead of re-authenticating.
    expect(second.headers.get("location") ?? "").toContain("error=INVALID_TOKEN");
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "single-use@example.com" },
    });
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
  });
});

describe("organisation invitations", () => {
  test("invite -> accept adds a member with the invited role", async () => {
    const owner = await signIn("owner2@example.com");
    const org = await createOrg(owner, "org-invite");

    await auth.api.createInvitation({
      body: { email: "analyst@example.com", role: "analyst", organizationId: org.id },
      headers: headers(owner),
    });

    const invitation = await prisma.invitation.findFirstOrThrow({
      where: { email: "analyst@example.com", organizationId: org.id },
    });

    const analyst = await signIn("analyst@example.com");
    const accepted = await auth.api.acceptInvitation({
      body: { invitationId: invitation.id },
      headers: headers(analyst),
    });
    expect(accepted).toBeTruthy();

    const member = await prisma.member.findFirstOrThrow({
      where: { organizationId: org.id, userId: analyst.userId },
    });
    expect(member.role).toBe("analyst");

    const invitationAfter = await prisma.invitation.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    expect(invitationAfter.status).toBe("accepted");
  });

  test("an accepted invitation cannot be accepted again", async () => {
    const owner = await signIn("owner3@example.com");
    const org = await createOrg(owner, "org-single-use");

    await auth.api.createInvitation({
      body: { email: "again@example.com", role: "viewer", organizationId: org.id },
      headers: headers(owner),
    });
    const invitation = await prisma.invitation.findFirstOrThrow({
      where: { email: "again@example.com" },
    });

    const invitee = await signIn("again@example.com");
    await auth.api.acceptInvitation({
      body: { invitationId: invitation.id },
      headers: headers(invitee),
    });

    await expect(
      auth.api.acceptInvitation({
        body: { invitationId: invitation.id },
        headers: headers(invitee),
      }),
    ).rejects.toThrow();
  });

  test("an expired invitation cannot be accepted", async () => {
    const owner = await signIn("owner4@example.com");
    const org = await createOrg(owner, "org-expiry");

    await auth.api.createInvitation({
      body: { email: "late@example.com", role: "reviewer", organizationId: org.id },
      headers: headers(owner),
    });
    const invitation = await prisma.invitation.findFirstOrThrow({
      where: { email: "late@example.com" },
    });
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const invitee = await signIn("late@example.com");
    await expect(
      auth.api.acceptInvitation({
        body: { invitationId: invitation.id },
        headers: headers(invitee),
      }),
    ).rejects.toThrow();
  });
});

describe("tenant isolation", () => {
  test("resolveTenant rejects missing and cross-organisation contexts", async () => {
    const alice = await signIn("alice@example.com");
    const aliceOrg = await createOrg(alice, "org-alice");
    const bob = await signIn("bob@example.com");
    const bobOrg = await createOrg(bob, "org-bob");

    const ownMembership = await resolveTenant(alice.userId, aliceOrg.id);
    expect(ownMembership.organizationId).toBe(aliceOrg.id);
    expect(ownMembership.role).toBe("owner");

    await expect(resolveTenant(alice.userId, null)).rejects.toMatchObject({
      status: 409,
      code: "no_active_organization",
    });
    await expect(resolveTenant(alice.userId, bobOrg.id)).rejects.toBeInstanceOf(TenantError);
    await expect(resolveTenant(alice.userId, bobOrg.id)).rejects.toMatchObject({
      status: 403,
      code: "not_a_member",
    });
  });

  test("clients are org-scoped: names unique per org, invisible across orgs", async () => {
    const alice = await signIn("alice2@example.com");
    const aliceOrg = await createOrg(alice, "org-alice-clients");
    const bob = await signIn("bob2@example.com");
    const bobOrg = await createOrg(bob, "org-bob-clients");

    await prisma.client.create({ data: { organizationId: aliceOrg.id, name: "Acme" } });

    // Same name in another org is fine (org-scoped uniqueness).
    await prisma.client.create({ data: { organizationId: bobOrg.id, name: "Acme" } });

    // Duplicate within one org is rejected.
    await expect(
      prisma.client.create({ data: { organizationId: aliceOrg.id, name: "Acme" } }),
    ).rejects.toThrow();

    const aliceClients = await prisma.client.findMany({ where: { organizationId: aliceOrg.id } });
    const bobClients = await prisma.client.findMany({ where: { organizationId: bobOrg.id } });
    expect(aliceClients).toHaveLength(1);
    expect(bobClients).toHaveLength(1);
    expect(aliceClients[0].organizationId).not.toBe(bobClients[0].organizationId);
  });
});
