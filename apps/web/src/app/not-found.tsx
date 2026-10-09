import type { Metadata } from "next";
import NotFound from "@/components/modules/NotFound";

export const metadata: Metadata = {
  title: "Record Not Found",
  robots: { index: false },
};

export default function NotFoundPage() {
  return <NotFound />;
}
