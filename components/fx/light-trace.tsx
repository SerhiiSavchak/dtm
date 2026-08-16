"use client";

import { revealStateClass, useInView, useRevealMotion } from "./use-in-view";

type LightTraceProps = {
  className?: string;
};

/**
 * Soft orange 1px trace. Observed host stays measurable; scale lives on the
 * inner hairline so IntersectionObserver cannot be zeroed by scaleX(0).
 */
export function LightTrace({ className = "" }: LightTraceProps) {
  const inherited = useRevealMotion();
  const local = useInView<HTMLSpanElement>({
    policy: inherited?.policy ?? "reveal-once",
    enabled: !inherited,
  });
  const inView = inherited?.inView ?? local.inView;
  const cycle = inherited?.cycle ?? local.cycle;
  const armed = inherited?.armed ?? local.armed;
  const stateClass = revealStateClass(inView, armed);

  return (
    <span
      ref={inherited ? undefined : local.ref}
      className={`arch-trace-host ${className}`}
      aria-hidden
    >
      <span
        className={`arch-trace ${stateClass}`}
        data-reveal-cycle={cycle}
      />
    </span>
  );
}
