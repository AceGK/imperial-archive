import type { Metadata } from "next";
import ProfileSettings from "@/components/modules/Account/ProfileSettings";

export const metadata: Metadata = { title: "Profile | Account" };

export default function ProfilePage() {
  return <ProfileSettings />;
}
