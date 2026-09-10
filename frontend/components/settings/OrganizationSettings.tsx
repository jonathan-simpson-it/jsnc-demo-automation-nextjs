"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

type Invitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string | Date;
};

const MANAGE_ROLES = new Set(["owner", "admin"]);
const INVITABLE_ROLES = [
  { value: "analyst", label: "Analyst" },
  { value: "reviewer", label: "Reviewer" },
  { value: "viewer", label: "Viewer" },
  { value: "admin", label: "Admin" },
] as const;
const ASSIGNABLE_ROLES = [...INVITABLE_ROLES, { value: "member", label: "Member" }] as const;

type InvitableRole = (typeof INVITABLE_ROLES)[number]["value"];
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]["value"];
const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  analyst: "Analyst",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

function errorMessage(error: { code?: string; message?: string } | null): string {
  const code = error?.code ?? "";
  if (code.includes("USER_ALREADY_MEMBER")) return "This person is already a member.";
  if (code.includes("INVITATION")) return "An invitation is already pending for this email.";
  if (code.includes("LIMIT")) return "This workspace has reached its member limit.";
  if (code.includes("SLUG")) return "That address is taken. Choose a different one.";
  if (code.includes("FORBIDDEN") || code.includes("NOT_ALLOWED")) {
    return "You do not have permission to do that.";
  }
  return error?.message || "Something went wrong. Try again.";
}

export default function OrganizationSettings() {
  const router = useRouter();
  const { data: organizations, isPending: orgsPending } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const activeId = activeOrganization?.id ?? null;
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitableRole>("analyst");
  const [inviting, setInviting] = useState(false);

  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [myUserId, setMyUserId] = useState("");

  useEffect(() => {
    void authClient.getSession().then(({ data }) => setMyUserId(data?.user?.id ?? ""));
  }, []);

  const loadOrgData = useCallback(async () => {
    if (!activeId) return;
    setMembersLoading(true);
    const [membersRes, invitesRes] = await Promise.all([
      authClient.organization.listMembers({ query: { organizationId: activeId } }),
      authClient.organization.listInvitations({ query: { organizationId: activeId } }),
    ]);
    setMembersLoading(false);
    if (membersRes.data) setMembers(membersRes.data.members as Member[]);
    if (invitesRes.data) {
      setInvitations((invitesRes.data as Invitation[]).filter((i) => i.status === "pending"));
    }
  }, [activeId]);

  useEffect(() => {
    setNotice("");
    setError("");
    void loadOrgData();
  }, [loadOrgData]);

  const myMember = members.find((m) => m.userId === myUserId) ?? null;
  const canManage = myMember ? MANAGE_ROLES.has(myMember.role) : false;

  function deriveSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  async function createOrganization(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setCreatingOrg(true);
    const { error: createError } = await authClient.organization.create({
      name: orgName.trim(),
      slug: orgSlug,
    });
    setCreatingOrg(false);
    if (createError) {
      setError(errorMessage(createError));
      return;
    }
    setOrgName("");
    setOrgSlug("");
    setSlugEdited(false);
    router.refresh();
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setInviting(true);
    const { error: inviteError } = await authClient.organization.inviteMember({
      email: inviteEmail.trim(),
      role: inviteRole,
      organizationId: activeId ?? undefined,
    });
    setInviting(false);
    if (inviteError) {
      setError(errorMessage(inviteError));
      return;
    }
    setNotice(`Invitation sent to ${inviteEmail.trim()}.`);
    setInviteEmail("");
    void loadOrgData();
  }

  async function updateRole(memberId: string, role: AssignableRole) {
    setBusyMemberId(memberId);
    setError("");
    const { error: roleError } = await authClient.organization.updateMemberRole({
      memberId,
      role,
      organizationId: activeId ?? undefined,
    });
    setBusyMemberId(null);
    if (roleError) {
      setError(errorMessage(roleError));
      return;
    }
    void loadOrgData();
  }

  async function removeMember(memberId: string) {
    setBusyMemberId(memberId);
    setError("");
    const { error: removeError } = await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
      organizationId: activeId ?? undefined,
    });
    setBusyMemberId(null);
    if (removeError) {
      setError(errorMessage(removeError));
      return;
    }
    void loadOrgData();
  }

  async function cancelInvitation(invitationId: string) {
    setError("");
    const { error: cancelError } = await authClient.organization.cancelInvitation({ invitationId });
    if (cancelError) {
      setError(errorMessage(cancelError));
      return;
    }
    void loadOrgData();
  }

  if (orgsPending) {
    return (
      <div className="container py-16">
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>Loading workspace…</p>
      </div>
    );
  }

  const hasOrg = Boolean(activeId) && (organizations ?? []).length > 0;

  return (
    <div className="container max-w-3xl py-14">
      <h1 className="text-2xl font-semibold">Workspace settings</h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--color-muted)" }}>
        Organisation, members and invitations.
      </p>

      {(error || notice) && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-md border border-line bg-surface px-4 py-3 text-sm"
          style={{ color: error ? "var(--color-error)" : "var(--color-ok)" }}
        >
          {error || notice}
        </div>
      )}

      {!hasOrg && (
        <section className="mt-10" aria-labelledby="create-org-heading">
          <h2 id="create-org-heading" className="text-lg font-semibold">
            Create your organisation
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: "var(--color-muted)" }}>
            This becomes your workspace. You can invite colleagues after it exists.
          </p>
          <form onSubmit={createOrganization} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="org-name" className="text-xs font-medium uppercase tracking-wider">
                Organisation name
              </label>
              <input
                id="org-name"
                className="input"
                value={orgName}
                required
                maxLength={64}
                placeholder="Example Capital Partners"
                onChange={(e) => {
                  setOrgName(e.target.value);
                  if (!slugEdited) setOrgSlug(deriveSlug(e.target.value));
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="org-slug" className="text-xs font-medium uppercase tracking-wider">
                Workspace address
              </label>
              <input
                id="org-slug"
                className="input font-mono"
                value={orgSlug}
                required
                maxLength={48}
                pattern="[a-z0-9-]+"
                placeholder="example-capital"
                onChange={(e) => {
                  setSlugEdited(true);
                  setOrgSlug(deriveSlug(e.target.value));
                }}
              />
            </div>
            <button type="submit" className="button button--solid self-start" disabled={creatingOrg || !orgName.trim() || !orgSlug}>
              {creatingOrg ? "Creating…" : "Create organisation"}
            </button>
          </form>
        </section>
      )}

      {hasOrg && (
        <>
          <section className="mt-10" aria-labelledby="org-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="org-heading" className="text-lg font-semibold">
                {activeOrganization?.name}
              </h2>
              {myMember && (
                <span className="chip">{ROLE_LABELS[myMember.role] ?? myMember.role}</span>
              )}
            </div>
            <p className="mt-1 font-mono text-xs" style={{ color: "var(--color-muted)" }}>
              {activeOrganization?.slug}
            </p>
          </section>

          <section className="mt-10" aria-labelledby="invite-heading">
            <h2 id="invite-heading" className="text-lg font-semibold">
              Invite a member
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "var(--color-muted)" }}>
              Invitations expire after 7 days and can only be accepted once.
            </p>
            {canManage ? (
              <form onSubmit={sendInvite} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label htmlFor="invite-email" className="text-xs font-medium uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    className="input"
                    required
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:w-40">
                  <label htmlFor="invite-role" className="text-xs font-medium uppercase tracking-wider">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    className="select"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as InvitableRole)}
                  >
                    {INVITABLE_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="button button--solid" disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? "Sending…" : "Send invite"}
                </button>
              </form>
            ) : (
              <p className="mt-5 text-sm" style={{ color: "var(--color-muted)" }}>
                Only owners and admins can invite members.
              </p>
            )}
          </section>

          {invitations.length > 0 && (
            <section className="mt-10" aria-labelledby="pending-heading">
              <h2 id="pending-heading" className="text-lg font-semibold">
                Pending invitations
              </h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{invitation.email}</p>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                        {ROLE_LABELS[invitation.role ?? ""] ?? "Member"} · expires{" "}
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        className="button button--ghost button--small"
                        onClick={() => cancelInvitation(invitation.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10" aria-labelledby="members-heading">
            <h2 id="members-heading" className="text-lg font-semibold">
              Members
            </h2>
            {membersLoading ? (
              <p className="mt-4 text-sm" style={{ color: "var(--color-muted)" }} aria-busy="true">
                Loading members…
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {members.map((member) => {
                  const isSelf = member.userId === myUserId;
                  const isOwner = member.role === "owner";
                  const rowBusy = busyMemberId === member.id;
                  return (
                    <li key={member.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {member.user.name || member.user.email}
                          {isSelf && <span className="ml-2 text-xs" style={{ color: "var(--color-muted)" }}>you</span>}
                        </p>
                        <p className="truncate text-xs" style={{ color: "var(--color-muted)" }}>
                          {member.user.email}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {canManage && !isOwner ? (
                          <select
                            className="select"
                            value={member.role}
                            disabled={rowBusy}
                            aria-label={`Role for ${member.user.email}`}
                            onChange={(e) => updateRole(member.id, e.target.value as AssignableRole)}
                          >
                            {ASSIGNABLE_ROLES.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
                            {ROLE_LABELS[member.role] ?? member.role}
                          </span>
                        )}
                        {canManage && !isSelf && !isOwner && (
                          <button
                            type="button"
                            className="button button--ghost button--small"
                            disabled={rowBusy}
                            onClick={() => removeMember(member.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
