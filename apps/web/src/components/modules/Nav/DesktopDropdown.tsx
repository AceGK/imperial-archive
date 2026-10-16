// components/modules/Nav/DesktopDropdown.tsx
"use client";

import Link from "next/link";
import { dropdownItems } from "./nav";
import type { DropdownMenu } from "./useDropdownMenu";
import styles from "./styles.module.scss";

/**
 * The arrow under the open trigger and the panel of links below it. The panel
 * holds every group's links, showing only the open one, so it can measure and
 * animate between them.
 */
export default function DesktopDropdown({
  menu,
  isLinkActive,
}: {
  menu: DropdownMenu;
  isLinkActive: (href: string) => boolean;
}) {
  const { activeIndex, prevIndex, isOpen, indicatorStyle, viewportSize } = menu;

  return (
    <>
      {/* dropdown indicator arrow */}
      <div
        className={styles.indicator}
        style={{
          ...indicatorStyle,
          transition:
            prevIndex === null && isOpen
              ? "opacity 200ms ease"
              : "transform 250ms ease, width 250ms ease, opacity 200ms ease",
        }}
      >
        <div className={styles.arrow} />
      </div>

      {/* dropdown panel */}
      <div
        className={styles.viewportPosition}
        ref={menu.panelRef}
        onKeyDown={menu.onPanelKeyDown}
        style={{
          left: viewportSize.left,
          pointerEvents: isOpen ? "auto" : "none",
          transition: prevIndex === null && isOpen ? "none" : undefined,
        }}
        onMouseEnter={menu.cancelCloseDropdown}
        onMouseLeave={menu.startCloseDropdown}
      >
        <div className={styles.bridge} />
        <div
          className={styles.viewport}
          data-state={isOpen ? "open" : "closed"}
          style={{
            width: isOpen ? viewportSize.width : 0,
            height: isOpen ? viewportSize.height : 0,
          }}
        >
          {dropdownItems.map((item, index) => (
            <div
              key={item.label}
              id={`nav-panel-${index}`}
              className={styles.content}
              ref={(el) => {
                menu.contentRefs.current[index] = el;
              }}
              data-motion={menu.getMotion(index)}
              style={{ display: activeIndex === index ? "block" : "none" }}
            >
              <ul className={`${styles.linkList} ${item.columns === 2 ? styles.twoCol : ""}`}>
                {item.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`${styles.listItemLink} ${isLinkActive(link.href) ? styles.active : ""}`}
                        onClick={menu.closeDropdown}
                      >
                        {Icon && (
                          <span className={styles.listItemIcon}>
                            <Icon aria-hidden="true" />
                          </span>
                        )}
                        <span className={styles.listItemText}>
                          <span className={styles.listItemLabel}>
                            {link.label}
                            {link.comingSoon && <span className={styles.soonTag}>Soon</span>}
                          </span>
                          {link.description && <span className={styles.listItemDesc}>{link.description}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
