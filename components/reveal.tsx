"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children?: ReactNode;
  /** rise: fade+up · clip: image mask · rule: line draw · mask: overflow reveal · fade: opacity only */
  variant?: "rise" | "clip" | "rule" | "mask" | "fade";
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

  if (variant === "rule") {
    return (
      <Tag
        ref={ref}
        className={`fx-rule ${inView ? "is-in" : ""} ${className}`}
        style={styleVar}
      >
        {children}
      </Tag>
    );
  }

  if (variant === "mask") {
    return (
      <Tag
        ref={ref}
        className={`fx-mask ${inView ? "is-in" : ""} ${className}`}
        style={styleVar}
      >
        <span className="fx-mask-inner">{children}</span>
      </Tag>
    );
  }

  if (variant === "fade") {
    return (
      <Tag
        ref={ref}
        className={`fx-fade ${inView ? "is-in" : ""} ${className}`}
        style={styleVar}
      >
        {children}
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
