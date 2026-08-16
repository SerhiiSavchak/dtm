"use client";

import { useInView } from "./use-in-view";

type ArchitecturalRuleProps = {
  className?: string;
};

/** Full-width hairline with an orange origin tick. Draws once on enter. */
export function ArchitecturalRule({ className = "" }: ArchitecturalRuleProps) {
  const { ref, inView } = useInView<HTMLSpanElement>();

  return (
    <span
      ref={ref}
      className={`arch-rule ${inView ? "is-in" : ""} ${className}`}
      aria-hidden
    >
      <span className="arch-rule-tick" />
      <span className="arch-rule-line" />
    </span>
  );
}
