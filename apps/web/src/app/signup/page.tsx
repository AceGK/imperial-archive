import type { Metadata } from "next";
import AuthForm from "@/components/modules/AuthForm";

// private / placeholder page: keep out of search results
export const metadata: Metadata = {
  title: "Sign Up",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <section className="container">
      <AuthForm mode="signUp" />
    </section>
  );
}
