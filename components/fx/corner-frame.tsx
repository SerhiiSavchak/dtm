"use client";

import type { ReactNode } from "react";
import { revealStateClass, useInView, useRevealMotion } from "./use-in-view";

type CornerFrameProps = {
  children?: ReactNode;
  className?: string;
};

/** L-shaped corner marks. Opacity + transform only, on the marks — not the host. */
export function CornerFrame({ children, className = "" }: CornerFrameProps) {
  const inherited = useRevealMotion();
  const local = useInView<HTMLDivElement>({
    policy: inherited?.policy ?? "reveal-once",
    enabled: !inherited,
  });
  const inView = inherited?.inView ?? local.inView;
  const cycle = inherited?.cycle ?? local.cycle;
  const armed = inherited?.armed ?? local.armed;

  return (
    <div
      ref={inherited ? undefined : local.ref}
      className={`arch-corners ${revealStateClass(inView, armed)} ${className}`}
      data-reveal-cycle={cycle}
    >
      <span className="arch-corner is-tl" aria-hidden />
      <span className="arch-corner is-tr" aria-hidden />
      <span className="arch-corner is-bl" aria-hidden />
      <span className="arch-corner is-br" aria-hidden />
      {children}
    </div>
  );
}
