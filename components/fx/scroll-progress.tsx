"use client";

import { useEffect, useRef } from "react";

/**
 * Desktop-only 2px page progress. rAF + DOM writes; no React state on scroll.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = desktop.matches && !reduce.matches;

    const paint = () => {
      frame = 0;
      if (!visible) {
        bar.style.transform = "scaleX(0)";
        return;
      }
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    const syncMode = () => {
      visible = desktop.matches && !reduce.matches;
      bar.hidden = !desktop.matches;
      onScroll();
    };

    syncMode();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    desktop.addEventListener("change", syncMode);
    reduce.addEventListener("change", syncMode);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      desktop.removeEventListener("change", syncMode);
      reduce.removeEventListener("change", syncMode);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="arch-progress" aria-hidden>
      <div ref={barRef} className="arch-progress-bar" />
    </div>
  );
}
