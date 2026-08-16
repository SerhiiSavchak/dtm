"use client";

import { useEffect, useRef } from "react";

type HoverMediaLabelProps = {
  label: string;
};

/**
 * Pointer-follow label on clickable portfolio media.
 * Fine-pointer only. Not a global cursor. pointer-events: none.
 */
export function HoverMediaLabel({ label }: HoverMediaLabelProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tag = ref.current;
    const host = tag?.parentElement;
    if (!tag || !host) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      tag.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (event: PointerEvent) => {
      const box = host.getBoundingClientRect();
      x = event.clientX - box.left;
      y = event.clientY - box.top;
      const dragging =
        host.closest(".project-viewport")?.getAttribute("data-dragging") ===
        "true";
      tag.classList.toggle("is-on", !dragging);
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    const onLeave = () => {
      tag.classList.remove("is-on");
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <span ref={ref} className="arch-media-label" aria-hidden>
      <span className="arch-media-label-text">{label}</span>
    </span>
  );
}
