import type { Metadata } from "next";
import ResetPasswordForm from "@/components/modules/AuthForm/ResetPasswordForm";

// private / placeholder page: keep out of search results
export const metadata: Metadata = {
  title: "Reset Password",
  alternates: { canonical: "/reset-password" },
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="container">
      <ResetPasswordForm />
    </section>
  );
}
