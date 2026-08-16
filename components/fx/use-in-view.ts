"use client";

import { useEffect, useRef, useState } from "react";

type InViewOptions = {
  threshold?: number;
  rootMargin?: string;
};

/**
 * One-shot IntersectionObserver. Content stays visible without JS
 * (CSS only hides when html[data-motion="ok"] and .is-in is absent).
 */
export function useInView<T extends HTMLElement>(options: InViewOptions = {}) {
  const { threshold = 0.16, rootMargin = "0px 0px -6% 0px" } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, inView };
}
