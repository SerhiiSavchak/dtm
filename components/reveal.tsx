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

  const styleVar = delay
    ? ({ "--fx-delay": `${delay}s` } as React.CSSProperties)
    : undefined;

  // Clip variant: the observed node must NOT be the clipped node. A
  // `clip-path: inset(0 0 100%)` collapses the element's visible area to zero,
  // which makes IntersectionObserver report ratio 0 forever — a deadlock where
  // the reveal can never trigger. So we observe an unclipped outer wrapper and
  // apply the clip mask to an inner element instead.
  if (variant === "clip") {
    return (
      <Tag ref={ref} className={className}>
        <span
          className={`fx-clip block ${inView ? "is-in" : ""}`}
          style={styleVar}
        >
          {children}
        </span>
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={`fx ${inView ? "is-in" : ""} ${className}`}
      style={styleVar}
    >
      {children}
    </Tag>
  );
}
