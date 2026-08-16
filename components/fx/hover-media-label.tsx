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
    let cx = 0;
    let cy = 0;
    let seeded = false;
    const follow = 0.2;

    const paint = () => {
      cx += (x - cx) * follow;
      cy += (y - cy) * follow;
      tag.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(x - cx) + Math.abs(y - cy) > 0.2) {
        frame = window.requestAnimationFrame(paint);
      } else {
        tag.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        frame = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      const box = host.getBoundingClientRect();
      x = Math.max(36, Math.min(box.width - 36, event.clientX - box.left));
      y = Math.max(28, Math.min(box.height - 28, event.clientY - box.top));
      if (!seeded) {
        cx = x;
        cy = y;
        seeded = true;
      }
      const dragging =
        host.closest(".project-viewport")?.getAttribute("data-dragging") ===
        "true";
      tag.classList.toggle("is-on", !dragging);
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    const onLeave = () => {
      tag.classList.remove("is-on");
      seeded = false;
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
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
