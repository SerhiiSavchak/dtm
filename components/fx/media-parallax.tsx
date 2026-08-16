"use client";

import { useEffect, useRef, type ReactNode } from "react";

type MediaParallaxProps = {
  children: ReactNode;
  amount?: number;
  className?: string;
};

function canParallax() {
  return (
    window.matchMedia("(min-width: 1024px)").matches &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(update: slow)").matches
  );
}

/** 8–18px inner parallax. Disabled on mobile / reduced motion. */
export function MediaParallax({
  children,
  amount = 12,
  className = "",
}: MediaParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    let active = canParallax();

    const paint = () => {
      frame = 0;
      if (!active) {
        el.style.transform = "translate3d(0, 0, 0)";
        return;
      }
      const box = el.getBoundingClientRect();
      const view = window.innerHeight || 1;
      const p = (box.top + box.height / 2 - view / 2) / view;
      const y = Math.max(-amount, Math.min(amount, -p * amount * 1.6));
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    const onChange = () => {
      active = canParallax();
      onScroll();
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onChange, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onChange);
      if (frame) window.cancelAnimationFrame(frame);
      el.style.removeProperty("transform");
    };
  }, [amount]);

  return (
    <div ref={ref} className={`arch-parallax ${className}`}>
      {children}
    </div>
  );
}
