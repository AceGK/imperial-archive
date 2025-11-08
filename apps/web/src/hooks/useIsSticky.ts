import React from "react";

export default function useIsSticky(
  ref: React.RefObject<HTMLElement | null>,
  stickyOffset: number = 0
) {
  const [isSticky, setIsSticky] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Create a sentinel element right before the sticky element
    const sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.height = '1px';
    sentinel.style.width = '1px';
    sentinel.style.pointerEvents = 'none';
    
    element.parentElement?.insertBefore(sentinel, element);

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Element is sticky when sentinel is not visible
        setIsSticky(!entry.isIntersecting);
      },
      { 
        threshold: [0],
        rootMargin: `-${stickyOffset}px 0px 0px 0px`
      }
    );

    observer.observe(sentinel);
    
    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, [stickyOffset]);

  return isSticky;
}