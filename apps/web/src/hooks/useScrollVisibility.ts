// hooks/useScrollVisibility.ts
import { useEffect, useState } from "react";

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

      // Always show nav if scrolled less than 50px
      if (scrollY < 50) {
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