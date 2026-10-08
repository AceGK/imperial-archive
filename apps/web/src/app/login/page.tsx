import type { Metadata } from "next";
import AuthForm from "@/components/modules/AuthForm";

// private / placeholder page: keep out of search results
export const metadata: Metadata = {
  title: "Log In",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <section className="container">
      <AuthForm mode="signIn" />
    </section>
  );
}