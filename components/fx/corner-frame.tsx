"use client";

import type { ReactNode } from "react";
import { useInView } from "./use-in-view";

type CornerFrameProps = {
  children?: ReactNode;
  className?: string;
};

/** L-shaped corner marks. Opacity + transform only. */
export function CornerFrame({ children, className = "" }: CornerFrameProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`arch-corners ${inView ? "is-in" : ""} ${className}`}
    >
      <span className="arch-corner is-tl" aria-hidden />
      <span className="arch-corner is-tr" aria-hidden />
      <span className="arch-corner is-bl" aria-hidden />
      <span className="arch-corner is-br" aria-hidden />
      {children}
    </div>
  );
}
