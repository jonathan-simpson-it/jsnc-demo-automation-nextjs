import type { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in — Jonathan Simpson & Co.",
};

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  return <SignInForm next={next} error={error} />;
}
