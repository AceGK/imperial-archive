'use client';

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@convex/_generated/api";
import ChevronRight from "@/components/icons/chevron-right.svg";
import SectionHeader from "./SectionHeader";
import { accountNav } from "./nav";
import styles from "./styles.module.scss";

export default function Overview() {
  const viewer = useQuery(api.users.viewer);
  const sections = accountNav.flatMap((group) => group.items).filter((item) => item.href !== "/account");

  return (
    <>
      <SectionHeader
        title="Welcome back"
        // description={viewer?.email ? `Signed in as ${viewer.email}` : undefined}
      />

      <div className={styles.cardGrid}>
        {sections.map(({ href, label, description, icon: Icon, comingSoon }) => (
          <Link key={href} href={href} className={styles.linkCard}>
            <span className={styles.linkCardIcon}>
              <Icon />
            </span>
            <span className={styles.linkCardBody}>
              <span className={styles.linkCardTitle}>
                {label}
                {comingSoon && <span className={styles.soon}>Soon</span>}
              </span>
              <span className={styles.linkCardDescription}>{description}</span>
            </span>
            <ChevronRight className={styles.linkCardChevron} />
          </Link>
        ))}
      </div>
    </>
  );
}
