import type { Metadata } from "next";
import OrganizationSettings from "@/components/settings/OrganizationSettings";

export const metadata: Metadata = {
  title: "Workspace settings — Jonathan Simpson & Co.",
};

export default function SettingsPage() {
  return <OrganizationSettings />;
}
