import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Server-side gate for every workspace surface. proxy.ts only performs an
// optimistic cookie check; this layout validates the session against the
// database before rendering tenant data.
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }
  return <>{children}</>;
}
