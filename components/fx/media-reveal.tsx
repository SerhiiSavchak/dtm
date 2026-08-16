"use client";

import type { CSSProperties, ReactNode } from "react";
import { useInView } from "./use-in-view";

type MediaRevealProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  delay?: number;
  className?: string;
};

/**
 * Masked media entrance. Visible without JS (no clip until data-motion="ok").
 * Primary: full clip + settle. Secondary: shorter fade/translate.
 */
export function MediaReveal({
  children,
  variant = "primary",
  delay = 0,
  className = "",
}: MediaRevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.12 });
  const style = delay
    ? ({ "--fx-delay": `${delay}s` } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      className={`arch-media is-${variant} ${inView ? "is-in" : ""} ${className}`}
      style={style}
    >
      <div className="arch-media-inner">{children}</div>
    </div>
  );
}
