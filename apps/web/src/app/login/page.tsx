import type { Metadata } from "next";
import AuthForm from "@/components/modules/AuthForm";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to Imperial Archive to use your free Warhammer reading tracker: the books you've read, are reading, want to read, and own.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <section className="container">
      <AuthForm mode="signIn" />
    </section>
  );
}