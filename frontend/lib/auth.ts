import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { magicLink, organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail, sendMagicLinkEmail } from "@/lib/email";
import { ac, customRoles } from "@/lib/auth-roles";

const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: siteUrl,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  advanced: {
    database: {
      joins: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    magicLink({
      expiresIn: 600,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
    organization({
      ac,
      roles: customRoles,
      requireEmailVerificationOnInvitation: true,
      sendInvitationEmail: async (data) => {
        await sendInvitationEmail({
          email: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name || data.inviter.user.email,
          inviteUrl: `${siteUrl}/accept-invitation/${data.id}`,
        });
      },
    }),
    // Must be last: bridges Set-Cookie from server actions into Next.
    nextCookies(),
  ],
});
