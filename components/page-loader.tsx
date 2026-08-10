"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";

/**
 * Brief first-paint loader — covers real prep only, then hands off to hero.
 * Does not invent a multi-second fake wait.
 */
export function PageLoader({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      const id = window.setTimeout(() => {
        setPhase("gone");
        onDone?.();
      }, 0);
      return () => window.clearTimeout(id);
    }

    const outTimer = window.setTimeout(() => setPhase("out"), 700);
    const goneTimer = window.setTimeout(() => {
      setPhase("gone");
      onDone?.();
    }, 1100);

    return () => {
      window.clearTimeout(outTimer);
      window.clearTimeout(goneTimer);
    };
  }, [onDone]);

  if (phase === "gone") return null;

  return (
    <div
      className={`page-loader fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-deep ${
        phase === "out" ? "page-loader-out" : ""
      }`}
      aria-hidden="true"
    >
      <Logo tone="paper" withDescriptor />
      <div className="page-loader-line mt-8" />
    </div>
  );
}
