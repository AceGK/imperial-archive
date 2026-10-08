import type { Metadata } from "next";
import Overview from "@/components/modules/Account/Overview";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return <Overview />;
}
