import type { Metadata } from "next";
import InfoHeader from "@/components/modules/InfoHeader";
import ReportsInbox from "@/components/modules/ReportsInbox";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default function ReportsAdminPage() {
  return (
    <main>
      <section className="container row__md">
        <InfoHeader label="Adeptus Administratum · Admin" title="Reports" />
        <ReportsInbox />
      </section>
    </main>
  );
}
