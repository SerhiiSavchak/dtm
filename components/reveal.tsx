"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Motion variant: rise (translate + fade) or clip (image mask up) */
  variant?: "rise" | "clip";
  /** Delay in seconds for staggered sequences */
  delay?: number;
  /** Render element */
  as?: ElementType;
  className?: string;
};

/**
 * Restrained scroll-triggered reveal. A single IntersectionObserver toggles
 * `.is-in`; the actual transition lives in globals.css so motion stays on the
 * compositor. Honors prefers-reduced-motion via the CSS layer.
 */
export function Reveal({
  children,
  variant = "rise",
  delay = 0,
  as,
  className = "",
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const base = variant === "clip" ? "fx-clip" : "fx";

  return (
    <Tag
      ref={ref}
      className={`${base} ${inView ? "is-in" : ""} ${className}`}
      style={delay ? ({ "--fx-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
