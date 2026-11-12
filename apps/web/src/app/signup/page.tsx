import type { Metadata } from "next";
import AuthForm from "@/components/modules/AuthForm";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Imperial Archive account for the Warhammer reading tracker: log the Black Library books you've read, are reading, want to read, and own.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <section className="container">
      <AuthForm mode="signUp" />
    </section>
  );
}
