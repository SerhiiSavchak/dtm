"use client";

import { useInView } from "./use-in-view";

type LightTraceProps = {
  className?: string;
};

/** Soft orange 1px trace. Draws once. Not neon. */
export function LightTrace({ className = "" }: LightTraceProps) {
  const { ref, inView } = useInView<HTMLSpanElement>();

  return (
    <span
      ref={ref}
      className={`arch-trace ${inView ? "is-in" : ""} ${className}`}
      aria-hidden
    />
  );
}
