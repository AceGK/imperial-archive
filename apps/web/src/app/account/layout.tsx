import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import AccountShell from "@/components/modules/Account";
import { SIDEBAR_COOKIE } from "@/components/modules/Account/sidebar";

// private / placeholder page: keep out of search results
export const metadata: Metadata = {
  title: "Account",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  // read on the server so a collapsed sidebar arrives collapsed, without a jump
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";
  return (
    <section className="container">
      <AccountShell initialCollapsed={collapsed}>{children}</AccountShell>
    </section>
  );
}
