"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import SignOutIcon from "@/components/icons/account/sign-out.svg";
import { accountNav } from "@/components/modules/Account/nav";
import Avatar from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import styles from "./AccountMenu.module.scss";

/** Avatar button that opens the account menu. Renders nothing when signed out. */
export default function AccountMenu() {
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (!isAuthenticated) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Dropdown.Root modalTitle="Account">
      <Dropdown.Trigger asChild aria-label="Open account menu">
        <button type="button" className={styles.trigger}>
          <Avatar name={viewer?.email} image={viewer?.image} size="sm" />
        </button>
      </Dropdown.Trigger>

      <Dropdown.Content align="end" className={styles.menu}>
        <div className={styles.header}>
          <Avatar name={viewer?.email} image={viewer?.image} />
          <div className={styles.headerText}>
            <span className={styles.headerLabel}>Signed in as</span>
            <strong>{viewer?.email ?? " "}</strong>
          </div>
        </div>

        {accountNav.map((group, i) => (
          <div key={group.label ?? i}>
            <Dropdown.Separator />
            {group.items.map(({ href, label, icon: Icon, comingSoon }) => (
              <Dropdown.Item key={href} onSelect={() => router.push(href)}>
                <Icon className={styles.icon} />
                <span>{label}</span>
                {comingSoon && <span className={styles.soon}>Soon</span>}
              </Dropdown.Item>
            ))}
          </div>
        ))}

        <Dropdown.Separator />
        <Dropdown.Item onSelect={handleSignOut}>
          <SignOutIcon className={styles.icon} />
          <span>Sign Out</span>
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
