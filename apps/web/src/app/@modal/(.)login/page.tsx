import AuthModal from "@/components/modules/AuthForm/AuthModal";

// /login opened from a link inside the site: the form in a modal over the page
export default function LoginModal() {
  return <AuthModal mode="signIn" />;
}
