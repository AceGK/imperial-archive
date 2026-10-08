import type { Metadata } from "next";
import type { ReactNode } from "react";
import AccountShell from "@/components/modules/Account";

// private / placeholder page: keep out of search results
export const metadata: Metadata = {
  title: "Account",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <section className="container">
      <AccountShell>{children}</AccountShell>
    </section>
  );
}
