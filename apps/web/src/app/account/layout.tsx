import type { ReactNode } from "react";
import AccountShell from "@/components/modules/Account";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <section className="container">
      <AccountShell>{children}</AccountShell>
    </section>
  );
}
