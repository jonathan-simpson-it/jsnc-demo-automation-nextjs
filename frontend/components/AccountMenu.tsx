"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AccountMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function switchOrganization(organizationId: string) {
    if (switching || organizationId === activeOrganization?.id) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    await authClient.organization.setActive({ organizationId });
    setSwitching(false);
    setOpen(false);
    router.refresh();
  }

  async function signOut() {
    await authClient.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (isPending) {
    return <div className="h-8 w-20 shrink-0" aria-hidden="true" />;
  }

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-3.5 text-xs font-semibold uppercase tracking-wider text-ink transition hover:border-accent hover:text-accent"
      >
        Sign in
      </Link>
    );
  }

  const label = session.user.name || session.user.email;
  const initial = label.trim().charAt(0).toUpperCase();

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-2.5 text-xs font-medium text-ink transition hover:border-accent"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-semibold"
          style={{ background: "var(--color-accent-soft)", color: "var(--color-ink)" }}
          aria-hidden="true"
        >
          {initial}
        </span>
        <span className="max-w-[10rem] truncate">{activeOrganization?.name ?? "Account"}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-md border border-line bg-surface p-1.5"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="border-b border-line px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium">{label}</p>
            <p className="truncate text-xs" style={{ color: "var(--color-muted)" }}>
              {session.user.email}
            </p>
          </div>

          <div className="py-1.5">
            <p className="px-2.5 pb-1 text-[0.68rem] uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
              Organisation
            </p>
            {(organizations ?? []).map((org) => {
              const active = org.id === activeOrganization?.id;
              return (
                <button
                  key={org.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  disabled={switching}
                  onClick={() => switchOrganization(org.id)}
                  className="flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent-soft disabled:opacity-60"
                >
                  <span className="truncate">{org.name}</span>
                  {active && <CheckIcon />}
                </button>
              );
            })}
            {(organizations ?? []).length === 0 && (
              <p className="px-2.5 py-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
                No organisation yet.
              </p>
            )}
          </div>

          <div className="border-t border-line pt-1.5">
            <Link
              href="/settings"
              role="menuitem"
              className="block rounded px-2.5 py-1.5 text-sm transition-colors hover:bg-accent-soft"
              onClick={() => setOpen(false)}
            >
              Workspace settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="block w-full rounded px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent-soft"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
