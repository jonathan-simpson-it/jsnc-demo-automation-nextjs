"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const ERROR_MESSAGES: Record<string, string> = {
  INVITATION_NOT_FOUND: "This invitation no longer exists. Ask an admin to send a new one.",
  YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION:
    "The signed-in account does not match the invited email address. Sign out and use the invited address.",
  EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION:
    "Verify your email before accepting this invitation.",
  ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: "This organisation has reached its member limit.",
};

export default function AcceptInvitationCard({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [message, setMessage] = useState("");

  async function accept() {
    setStatus("pending");
    setMessage("");
    const { error } = await authClient.organization.acceptInvitation({ invitationId });
    if (error) {
      setStatus("error");
      setMessage(
        ERROR_MESSAGES[error.code ?? ""] ??
          "We could not accept this invitation. It may have expired or already been used.",
      );
      return;
    }
    // acceptInvitation activates the organisation on the session.
    router.push("/chat");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold">Join the workspace</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
        Accepting adds you as a member of this organisation and switches your active workspace to it.
      </p>
      {message && (
        <p role="alert" className="mt-6 text-sm" style={{ color: "var(--color-error)" }}>
          {message}
        </p>
      )}
      <button
        type="button"
        className="button button--solid mt-8"
        onClick={accept}
        disabled={status === "pending"}
        aria-busy={status === "pending"}
      >
        {status === "pending" ? "Accepting..." : "Accept invitation"}
      </button>
    </div>
  );
}
