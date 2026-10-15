'use client';

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api } from "@convex/_generated/api";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import Avatar from "@/components/ui/Avatar";
import SignOutIcon from "@/components/icons/account/sign-out.svg";
import ChevronLeft from "@/components/icons/chevron-left.svg";
import { accountNav } from "./nav";
import { SIDEBAR_COOKIE } from "./sidebar";
import { formatDate } from "./utils";
import styles from "./styles.module.scss";

export default function AccountShell({
  children,
  initialCollapsed = false,
}: {
  children: ReactNode;
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const isNavVisible = useScrollVisibility();
  // desktop only: the sidebar shrinks to its icons (phones show it as a tab row)
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/account; max-age=31536000; samesite=lax`;
  };

  const isActive = (href: string) =>
    href === "/account" ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ""}`}>
      <aside className={`${styles.sidebar} ${isNavVisible ? styles.navVisible : ""}`}>
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={styles.collapseIcon} aria-hidden="true" />
        </button>

        <div className={styles.identity} title={collapsed ? (viewer?.email ?? undefined) : undefined}>
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
            <div key={i} className={styles.navGroup}>
              <ul>
                {group.items.map(({ href, label, icon: Icon, comingSoon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`${styles.navLink} ${isActive(href) ? styles.active : ""}`}
                      aria-current={isActive(href) ? "page" : undefined}
                      // the label is hidden when collapsed, so name it on hover
                      title={collapsed ? label : undefined}
                    >
                      <Icon className={styles.navIcon} />
                      <span className={styles.navText}>{label}</span>
                      {comingSoon && <span className={styles.soon}>Soon</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles.navGroup}>
            <button
              type="button"
              className={`${styles.navLink} ${styles.signOut}`}
              onClick={handleSignOut}
              title={collapsed ? "Sign Out" : undefined}
            >
              <SignOutIcon className={styles.navIcon} />
              <span className={styles.navText}>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
