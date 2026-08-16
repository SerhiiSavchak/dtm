"use client";

import { useEffect, useRef } from "react";

function canMagnetize() {
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    window.matchMedia("(min-width: 1024px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Tiny 3–5px magnetic nudge. Writes CSS vars; no React state on move.
 * Desktop fine-pointer only.
 */
export function useMagnetic<T extends HTMLElement>(strength = 4) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canMagnetize()) return;

    let frame = 0;

    const paint = (clientX: number, clientY: number) => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const dx = clientX - (box.left + box.width / 2);
      const dy = clientY - (box.top + box.height / 2);
      const x = Math.max(-strength, Math.min(strength, dx * 0.12));
      const y = Math.max(-strength, Math.min(strength, dy * 0.16));
      el.style.setProperty("--mag-x", `${x.toFixed(2)}px`);
      el.style.setProperty("--mag-y", `${y.toFixed(2)}px`);
    };

    const onMove = (event: PointerEvent) => {
      if (frame) return;
      const { clientX, clientY } = event;
      frame = window.requestAnimationFrame(() => paint(clientX, clientY));
    };

    const onLeave = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      el.style.setProperty("--mag-x", "0px");
      el.style.setProperty("--mag-y", "0px");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) window.cancelAnimationFrame(frame);
      el.style.removeProperty("--mag-x");
      el.style.removeProperty("--mag-y");
    };
  }, [strength]);

  return ref;
}
