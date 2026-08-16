"use client";

import { revealStateClass, useInView, useRevealMotion } from "./use-in-view";

type ArchitecturalRuleProps = {
  className?: string;
};

/** Full-width hairline with an orange origin tick. Draws on section enter. */
export function ArchitecturalRule({ className = "" }: ArchitecturalRuleProps) {
  const inherited = useRevealMotion();
  const local = useInView<HTMLSpanElement>({
    policy: inherited?.policy ?? "reveal-reversible",
    enabled: !inherited,
  });
  const inView = inherited?.inView ?? local.inView;
  const cycle = inherited?.cycle ?? local.cycle;
  const direction = inherited?.direction ?? local.direction;
  const armed = inherited?.armed ?? local.armed;

  return (
    <span
      ref={inherited ? undefined : local.ref}
      className={`arch-rule ${revealStateClass(inView, armed)} ${className}`}
      data-reveal-cycle={cycle}
      data-scroll-dir={direction}
      aria-hidden
    >
      <span className="arch-rule-tick" />
      <span className="arch-rule-line" />
    </span>
  );
}
