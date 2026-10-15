import type { Metadata } from "next";
import AuthForm from "@/components/modules/AuthForm";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to Imperial Archive to track your Warhammer 40k reading, owned books, and favorites.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <section className="container">
      <AuthForm mode="signIn" />
    </section>
  );
}