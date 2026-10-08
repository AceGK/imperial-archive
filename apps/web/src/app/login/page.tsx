import AuthForm from "@/components/modules/AuthForm";

export default function LoginPage() {
  return (
    <section className="container">
      <AuthForm mode="signIn" />
    </section>
  );
}