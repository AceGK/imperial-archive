'use client';

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { api } from "@convex/_generated/api";
import Avatar from "@/components/ui/Avatar";
import SignOutIcon from "@/components/icons/account/sign-out.svg";
import { accountNav } from "./nav";
import { formatDate } from "./utils";
import styles from "./styles.module.scss";

export default function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();

  const isActive = (href: string) =>
    href === "/account" ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.identity}>
          <Avatar name={viewer?.email} image={viewer?.image} />
          <div className={styles.identityText}>
            <strong>{viewer?.email ?? " "}</strong>
            <span>
              {viewer ? `Member since ${formatDate(viewer.createdAt)}` : " "}
            </span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Account">
          {accountNav.map((group, i) => (
            <div key={group.label ?? i} className={styles.navGroup}>
              {group.label && <p className={styles.navLabel}>{group.label}</p>}
              <ul>
                {group.items.map(({ href, label, icon: Icon, comingSoon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`${styles.navLink} ${isActive(href) ? styles.active : ""}`}
                      aria-current={isActive(href) ? "page" : undefined}
                    >
                      <Icon className={styles.navIcon} />
                      <span>{label}</span>
                      {comingSoon && <span className={styles.soon}>Soon</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles.navGroup}>
            <button type="button" className={styles.navLink} onClick={handleSignOut}>
              <SignOutIcon className={styles.navIcon} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
