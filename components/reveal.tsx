"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import {
  RevealMotionContext,
  revealStateClass,
  useInView,
  useRevealMotion,
  type RevealPolicy,
} from "./fx/use-in-view";

type RevealProps = {
  children?: ReactNode;
  /** rise: fade+up · clip: image mask · rule: line draw · mask: overflow reveal · fade: opacity only */
  variant?: "rise" | "clip" | "rule" | "mask" | "fade";
  /** Delay in seconds for staggered sequences — applied on first enter only */
  delay?: number;
  /** Render element */
  as?: ElementType;
  className?: string;
  policy?: RevealPolicy;
  /** Ignore ancestor RevealGroup and observe this node. */
  isolate?: boolean;
};

type RevealGroupProps = {
  children?: ReactNode;
  as?: ElementType;
  className?: string;
  policy?: RevealPolicy;
};

function delayStyle(delay: number, cycle: "first" | "again"): CSSProperties | undefined {
  if (cycle === "again") return { "--fx-delay": "0s" } as CSSProperties;
  if (!delay) return undefined;
  return { "--fx-delay": `${delay}s` } as CSSProperties;
}

/**
 * Non-visual observer for grouped stagger. Children inherit inView / cycle /
 * direction and must not observe themselves. The wrapper has no opacity or
 * transform — those stay on the child variant nodes.
 */
export function RevealGroup({
  children,
  as,
  className = "",
  policy = "reveal-reversible",
}: RevealGroupProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, inView, cycle, direction, armed } = useInView<HTMLElement>({
    policy,
  });

  return (
    <Tag ref={ref} className={className}>
      <RevealMotionContext.Provider
        value={{ inView, cycle, direction, policy, armed }}
      >
        {children}
      </RevealMotionContext.Provider>
    </Tag>
  );
}

/**
 * Restrained scroll-triggered reveal. A pooled IntersectionObserver toggles
 * `.is-in`; motion lives in globals.css. Nested Reveals inside RevealGroup
 * (or another Reveal) reuse the ancestor trigger.
 */
export function Reveal({
  children,
  variant = "rise",
  delay = 0,
  as,
  className = "",
  policy = "reveal-reversible",
  isolate = false,
}: RevealProps) {
  const ctx = useRevealMotion();
  const inherited = isolate ? null : ctx;
  const Tag = (as ?? "div") as ElementType;
  const local = useInView<HTMLElement>({
    policy: inherited?.policy ?? policy,
    enabled: !inherited,
  });
  const inView = inherited?.inView ?? local.inView;
  const cycle = inherited?.cycle ?? local.cycle;
  const direction = inherited?.direction ?? local.direction;
  const armed = inherited?.armed ?? local.armed;
  const observeRef = inherited ? undefined : local.ref;
  const motion = inherited ?? {
    inView,
    cycle,
    direction,
    policy,
    armed,
  };
  const styleVar = delayStyle(delay, cycle);
  const stateClass = revealStateClass(inView, armed);
  const attrs = {
    "data-reveal-cycle": cycle,
    "data-scroll-dir": direction,
  };

  let node: ReactNode;

  if (variant === "clip") {
    node = (
      <Tag ref={observeRef} className={className}>
        <span
          className={`fx-clip block ${stateClass}`}
          style={styleVar}
          {...attrs}
        >
          {children}
        </span>
      </Tag>
    );
  } else if (variant === "rule") {
    node = (
      <Tag
        ref={observeRef}
        className={`fx-rule ${stateClass} ${className}`}
        style={styleVar}
        {...attrs}
      >
        <span className="fx-rule-inner">{children}</span>
      </Tag>
    );
  } else if (variant === "mask") {
    node = (
      <Tag ref={observeRef} className={className}>
        <span
          className={`fx-mask block ${stateClass}`}
          style={styleVar}
          {...attrs}
        >
          <span className="fx-mask-inner">{children}</span>
        </span>
      </Tag>
    );
  } else if (variant === "fade") {
    node = (
      <Tag
        ref={observeRef}
        className={`fx-fade ${stateClass} ${className}`}
        style={styleVar}
        {...attrs}
      >
        {children}
      </Tag>
    );
  } else {
    node = (
      <Tag
        ref={observeRef}
        className={`fx ${stateClass} ${className}`}
        style={styleVar}
        {...attrs}
      >
        {children}
      </Tag>
    );
  }

  return (
    <RevealMotionContext.Provider value={motion}>
      {node}
    </RevealMotionContext.Provider>
  );
}
