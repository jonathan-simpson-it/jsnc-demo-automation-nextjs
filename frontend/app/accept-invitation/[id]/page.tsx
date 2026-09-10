import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AcceptInvitationCard from "@/components/auth/AcceptInvitationCard";

export const metadata: Metadata = {
  title: "Accept invitation — Jonathan Simpson & Co.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AcceptInvitationPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(`/accept-invitation/${id}`)}`);
  }
  return <AcceptInvitationCard invitationId={id} />;
}
