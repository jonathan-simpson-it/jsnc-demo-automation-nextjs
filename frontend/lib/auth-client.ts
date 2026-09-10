import { createAuthClient } from "better-auth/react";
import { magicLinkClient, organizationClient } from "better-auth/client/plugins";
import { ac, customRoles } from "@/lib/auth-roles";

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    organizationClient({ ac, roles: customRoles }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
