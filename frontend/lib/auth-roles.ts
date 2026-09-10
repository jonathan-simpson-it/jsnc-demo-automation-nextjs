import { createAccessControl } from "better-auth/plugins/access";
import { defaultRoles, defaultStatements } from "better-auth/plugins/organization/access";

// Shared, dependency-free role definitions so the server (lib/auth.ts) and
// client (lib/auth-client.ts) agree on the organisation role vocabulary.
// Built-in owner/admin keep full management; analyst/reviewer/viewer carry no
// member/invitation management rights.
export const ac = createAccessControl(defaultStatements);

export const analyst = ac.newRole({});
export const reviewer = ac.newRole({});
export const viewer = ac.newRole({});

// Including the built-in roles keeps the inferred role union complete.
export const customRoles = { ...defaultRoles, analyst, reviewer, viewer };
