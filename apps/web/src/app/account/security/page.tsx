import type { Metadata } from "next";
import SecuritySettings from "@/components/modules/Account/SecuritySettings";

export const metadata: Metadata = { title: "Security | Account" };

export default function SecurityPage() {
  return <SecuritySettings />;
}
