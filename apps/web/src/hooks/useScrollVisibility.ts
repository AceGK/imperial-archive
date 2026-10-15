// hooks/useScrollVisibility.ts
import { useEffect, useState } from "react";

// Open nav menus (the nav's dropdowns, the account menu) pin the nav in view.
// Shared across every useScrollVisibility caller, so the nav and the elements
// that sit under it (catalog filters, account sidebar, contents rail) agree.
let pins = 0;

/** Keeps the nav shown while `active`, e.g. while one of its menus is open. */
export function useNavPin(active: boolean) {
  useEffect(() => {
    if (!active) return;
    pins++;
    return () => {
      pins--;
    };
  }, [active]);
}

export function useScrollVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < 5) {
        ticking = false;
        return;
      }

      // Always show nav if scrolled less than 50px, or while a nav menu is open
      // (menus only open while the nav is shown, so it just stays put)
      if (scrollY < 50 || pins > 0) {
        setIsVisible(true);
      } else {
        // Only apply hide/show logic after 50px threshold
        setIsVisible(scrollY < lastScrollY);
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return isVisible;
}
