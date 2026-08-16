"use client";

import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { useDictionary } from "@/lib/i18n/locale-context";
import { Reveal } from "../reveal";
import { SectionHead } from "../section-head";

const VIEWPORT_ANCHOR = 0.43;
const SCRUB_LERP = 0.16;
const ACTIVATION_OFFSET = 16;
const DEACTIVATION_OFFSET = 24;

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setStepDomState(
  step: HTMLElement,
  state: "is-pending" | "is-done" | "is-active"
) {
  step.classList.remove("is-pending", "is-done", "is-active");
  step.classList.add(state);
}

export function Process() {
  const t = useDictionary().process;
  const n = t.stages.length;
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const layoutRef = useRef({ markerTops: [] as number[], lineSpan: 0 });
  const activeRef = useRef<boolean[]>([]);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    getReduced,
    () => false
  );

  const measureLayout = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return false;

    const markers = markerRefs.current.slice(0, n);
    if (markers.length < n || markers.some((el) => !el)) return false;

    const railRect = rail.getBoundingClientRect();
    const markerTops = markers.map((marker) => {
      const rect = marker!.getBoundingClientRect();
      return rect.top + rect.height / 2 - railRect.top;
    });

    const lineTop = markerTops[0] ?? 0;
    const lineSpan = Math.max(0, (markerTops[n - 1] ?? lineTop) - lineTop);
    if (lineSpan <= 0) return false;

    layoutRef.current = { markerTops, lineSpan };

    const track = trackRef.current;
    if (track) {
      track.style.top = `${lineTop}px`;
      track.style.height = `${lineSpan}px`;
    }

    return true;
  }, [n]);

  const computeTargetProgress = useCallback(() => {
    const rail = railRef.current;
    const { markerTops, lineSpan } = layoutRef.current;
    if (!rail || markerTops.length < n || lineSpan <= 0) return Number.NaN;

    const railRect = rail.getBoundingClientRect();
    const viewportAnchor = window.innerHeight * VIEWPORT_ANCHOR;
    const startY = railRect.top + (markerTops[0] ?? 0);
    const endY = railRect.top + (markerTops[n - 1] ?? 0);
    const scrollSpan = endY - startY || 1;

    return (viewportAnchor - startY) / scrollSpan;
  }, [n]);

  const updateMarkerStates = useCallback(
    (progress: number) => {
      const { markerTops, lineSpan } = layoutRef.current;
      if (markerTops.length < n || lineSpan <= 0) return;

      const activationPad = ACTIVATION_OFFSET / lineSpan;
      const deactivationPad = DEACTIVATION_OFFSET / lineSpan;
      const active = activeRef.current;

      for (let i = 0; i < n; i += 1) {
        const markerProgress =
          ((markerTops[i] ?? 0) - (markerTops[0] ?? 0)) / lineSpan;
        const wasActive = active[i] ?? false;
        let isActive = wasActive;

        if (wasActive) {
          if (progress < markerProgress - deactivationPad) isActive = false;
        } else if (progress >= markerProgress - activationPad) {
          isActive = true;
        }

        if (isActive !== wasActive) active[i] = isActive;
      }

      let current = -1;
      for (let i = 0; i < n; i += 1) {
        if (active[i]) current = i;
      }

      for (let i = 0; i < n; i += 1) {
        const step = stepRefs.current[i];
        if (!step) continue;
        if (i < current) setStepDomState(step, "is-done");
        else if (i === current) setStepDomState(step, "is-active");
        else setStepDomState(step, "is-pending");
      }
    },
    [n]
  );

  useLayoutEffect(() => {
    let rafId = 0;
    let targetFill = 0;
    let smoothFill = 0;
    let primed = false;
    let retry = 0;
    activeRef.current = new Array(n).fill(false);

    const lerp = reduced ? 1 : SCRUB_LERP;

    const tick = () => {
      rafId = 0;
      if (!measureLayout()) {
        retry += 1;
        if (retry < 90) rafId = requestAnimationFrame(tick);
        return;
      }
      retry = 0;

      const raw = computeTargetProgress();
      if (Number.isNaN(raw)) {
        retry += 1;
        if (retry < 90) rafId = requestAnimationFrame(tick);
        return;
      }

      targetFill = Math.max(0, Math.min(1, raw));
      if (!primed || lerp >= 1 || raw <= 0 || raw >= 1) {
        smoothFill = targetFill;
        primed = true;
      } else {
        smoothFill += (targetFill - smoothFill) * lerp;
        if (Math.abs(targetFill - smoothFill) < 0.0008) {
          smoothFill = targetFill;
        }
      }

      if (fillRef.current) {
        fillRef.current.style.height = `${smoothFill * 100}%`;
      }
      updateMarkerStates(raw);

      if (Math.abs(targetFill - smoothFill) > 0.0008) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    scheduleTick();

    const scrollOpts: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };
    window.addEventListener("scroll", scheduleTick, scrollOpts);
    document.addEventListener("scroll", scheduleTick, scrollOpts);
    window.addEventListener("resize", scheduleTick);
    window.visualViewport?.addEventListener("resize", scheduleTick);
    window.visualViewport?.addEventListener("scroll", scheduleTick);

    const resizeObserver = new ResizeObserver(scheduleTick);
    if (sectionRef.current) resizeObserver.observe(sectionRef.current);
    if (railRef.current) resizeObserver.observe(railRef.current);
    if (listRef.current) resizeObserver.observe(listRef.current);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleTick, scrollOpts);
      document.removeEventListener("scroll", scheduleTick, scrollOpts);
      window.removeEventListener("resize", scheduleTick);
      window.visualViewport?.removeEventListener("resize", scheduleTick);
      window.visualViewport?.removeEventListener("scroll", scheduleTick);
      resizeObserver.disconnect();
    };
  }, [computeTargetProgress, measureLayout, n, reduced, updateMarkerStates]);

  return (
    <section
      ref={sectionRef}
      id="process"
      aria-labelledby="process-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <SectionHead label={t.label} right={t.labelRight} />

        <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-4 lg:self-start">
            <Reveal>
              <h2
                id="process-heading"
                className="type-h2 text-balance text-foreground"
              >
                {t.headingBefore}{" "}
                <span className="text-accent">{t.headingAccent}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="type-body-lg mt-4 max-w-md text-foreground/70">
                {t.body}
              </p>
            </Reveal>
          </div>

          <div ref={railRef} className="process-rail lg:col-span-8">
            <div ref={trackRef} className="process-rail-track" aria-hidden>
              <div ref={fillRef} className="process-rail-fill" />
            </div>

            <ol ref={listRef} className="relative">
              {t.stages.map((stage, i) => (
                <li
                  key={stage.index}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  data-step={i}
                  className="process-step grid grid-cols-[1.375rem_1fr] items-start gap-x-5 py-4 md:gap-x-6 md:py-5"
                >
                  <span
                    ref={(el) => {
                      markerRefs.current[i] = el;
                    }}
                    className="process-dot mt-0.5 block shrink-0"
                    data-process-marker-anchor
                    aria-hidden
                  />
                  <div className="min-w-0 border-b border-border pb-4 md:pb-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="process-step-index font-mono text-[0.8125rem] tabular-nums tracking-wide">
                        {stage.index}
                      </span>
                      <h3 className="process-step-title type-title">
                        {stage.title}
                      </h3>
                    </div>
                    <p className="process-step-text type-body-sm mt-2 max-w-md text-muted">
                      {stage.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
