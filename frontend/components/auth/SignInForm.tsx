"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN: "That sign-in link expired or was already used. Request a new one.",
  EXPIRED_TOKEN: "That sign-in link expired. Request a new one.",
};

export default function SignInForm({ next, error }: { next?: string; error?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent">("idle");
  const [message, setMessage] = useState(
    error ? (ERROR_MESSAGES[error] ?? "That sign-in link could not be verified. Request a new one.") : "",
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("pending");
    setMessage("");
    const callbackURL = next && next.startsWith("/") ? next : "/chat";
    const { error: sendError } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL,
      errorCallbackURL: "/sign-in?error=INVALID_TOKEN",
    });
    if (sendError) {
      setStatus("idle");
      setMessage("We could not send a sign-in link. Check the address and try again.");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
          We sent a sign-in link to <strong style={{ color: "var(--color-ink)" }}>{email}</strong>.
          The link works once and expires in 10 minutes.
        </p>
        <button
          type="button"
          className="button button--ghost mt-8"
          onClick={() => {
            setStatus("idle");
            setEmail("");
          }}
        >
          Use a different address
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-20">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
        Enter your work email and we will send you a sign-in link. No password needed.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            className="input"
            placeholder="you@company.com"
            value={email}
            disabled={status === "pending"}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={message ? "sign-in-error" : undefined}
          />
        </div>
        {message && (
          <p id="sign-in-error" role="alert" className="text-sm" style={{ color: "var(--color-error)" }}>
            {message}
          </p>
        )}
        <button
          type="submit"
          className="button button--solid"
          disabled={status === "pending" || !email.trim()}
          aria-busy={status === "pending"}
        >
          {status === "pending" ? "Sending..." : "Email me a sign-in link"}
        </button>
      </form>
      <p className="mt-6 text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
        Signing in creates an account if one does not exist yet.
      </p>
    </div>
  );
}
