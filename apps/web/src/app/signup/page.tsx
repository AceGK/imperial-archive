import type { Metadata } from "next";
import AuthForm from "@/components/modules/AuthForm";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Imperial Archive account to track your Warhammer 40k reading, owned books, and favorites.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <section className="container">
      <AuthForm mode="signUp" />
    </section>
  );
}
