"use client";

import type { CSSProperties, ReactNode } from "react";
import { revealStateClass, useInView, useRevealMotion } from "./use-in-view";

type MediaRevealProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  delay?: number;
  className?: string;
  /** Short orange hairline on the observed outer — not clipped with the inner mask. */
  trace?: boolean;
};

/**
 * Masked media entrance. Visible without JS (no clip until data-motion="ok").
 * The observed outer box is never clipped — clip/fade live on .arch-media-inner
 * so IntersectionObserver cannot be zeroed by its own hide rule.
 * Collage/media entrance is reveal-once — hover and modal own their motion.
 */
export function MediaReveal({
  children,
  variant = "primary",
  delay = 0,
  className = "",
  trace = false,
}: MediaRevealProps) {
  const inherited = useRevealMotion();
  const local = useInView<HTMLDivElement>({
    policy: inherited?.policy ?? "reveal-once",
    enabled: !inherited,
  });
  const inView = inherited?.inView ?? local.inView;
  const cycle = inherited?.cycle ?? local.cycle;
  const direction = inherited?.direction ?? local.direction;
  const armed = inherited?.armed ?? local.armed;
  const stateClass = revealStateClass(inView, armed);
  const style = (
    cycle === "again"
      ? { "--fx-delay": "0s" }
      : delay
        ? { "--fx-delay": `${delay}s` }
        : undefined
  ) as CSSProperties | undefined;

  return (
    <div
      ref={inherited ? undefined : local.ref}
      className={`arch-media is-${variant} ${stateClass} ${className}`}
      style={style}
      data-reveal-cycle={cycle}
      data-scroll-dir={direction}
    >
      <div className="arch-media-inner">{children}</div>
      {trace ? (
        <span
          className={`arch-trace ${stateClass}`}
          data-reveal-cycle={cycle}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
