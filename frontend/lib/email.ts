import { Resend } from "resend";

// Application interface around transactional email so the provider can be
// swapped without touching auth configuration. Never log tokens or links in
// production; without a provider key, development only prints them locally.
const apiKey = process.env.RESEND_API_KEY;
const from =
  process.env.RESEND_FROM_EMAIL ?? "JS&C AI <no-reply@jonathansimpson.co>";
const isProduction = process.env.NODE_ENV === "production";

type Mail = { to: string; subject: string; html: string; devHint?: string };

async function sendMail({ to, subject, html, devHint }: Mail): Promise<void> {
  if (!apiKey) {
    if (isProduction) {
      throw new Error("RESEND_API_KEY is not configured; refusing to skip email delivery in production");
    }
    console.info(
      `[dev-email] RESEND_API_KEY unset — ${subject} to ${to}\n[dev-email] ${devHint ?? html}`,
    );
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  await sendMail({
    to: email,
    subject: "Sign in to JS&C AI",
    devHint: url,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1c1c1a">
        <h1 style="font-size:20px;font-weight:600;margin:0 0 16px">Sign in to JS&C AI</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 24px">
          Use the button below to sign in. This link expires shortly and can only be used once.
        </p>
        <a href="${url}" style="display:inline-block;background:#1c1c1a;color:#f4f4ef;font-size:14px;padding:12px 20px;border-radius:6px;text-decoration:none">Sign in</a>
        <p style="font-size:12px;line-height:1.6;color:#6b6b64;margin:24px 0 0">
          If you did not request this email, you can safely ignore it.
        </p>
      </div>`,
  });
}

export async function sendInvitationEmail(params: {
  email: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}): Promise<void> {
  await sendMail({
    to: params.email,
    subject: `You are invited to ${params.organizationName} on JS&C AI`,
    devHint: params.inviteUrl,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1c1c1a">
        <h1 style="font-size:20px;font-weight:600;margin:0 0 16px">Join ${params.organizationName}</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 24px">
          ${params.inviterName} invited you to the ${params.organizationName} workspace on JS&C AI.
          This invitation expires in 7 days.
        </p>
        <a href="${params.inviteUrl}" style="display:inline-block;background:#1c1c1a;color:#f4f4ef;font-size:14px;padding:12px 20px;border-radius:6px;text-decoration:none">Accept invitation</a>
        <p style="font-size:12px;line-height:1.6;color:#6b6b64;margin:24px 0 0">
          If you were not expecting this invitation, you can safely ignore it.
        </p>
      </div>`,
  });
}
