"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDictionary } from "@/lib/i18n/locale-context";
import { Reveal } from "../reveal";
import { SectionHead } from "../section-head";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Process() {
  const t = useDictionary().process;
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    getReduced,
    () => false
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const steps = [...list.querySelectorAll<HTMLElement>("[data-step]")];
    if (!steps.length) return;

    if (reduced) {
      const id = window.setTimeout(() => {
        setProgress(1);
        setActive(steps.length - 1);
      }, 0);
      return () => window.clearTimeout(id);
    }

    const update = () => {
      const first = steps[0];
      const last = steps[steps.length - 1];
      const firstCenter =
        first.getBoundingClientRect().top + first.offsetHeight * 0.35;
      const lastCenter =
        last.getBoundingClientRect().top + last.offsetHeight * 0.35;
      const focus = window.innerHeight * 0.42;

      const span = lastCenter - firstCenter;
      const raw = span <= 0 ? 0 : (focus - firstCenter) / span;
      const next = Math.max(0, Math.min(1, raw));
      setProgress(next);

      let current = 0;
      steps.forEach((step, i) => {
        const center =
          step.getBoundingClientRect().top + step.offsetHeight * 0.35;
        if (center <= focus + 8) current = i;
      });
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reduced, t.stages.length]);

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
              <h2 id="process-heading" className="type-h2 text-foreground">
                {t.heading}
              </h2>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="mt-4 max-w-sm text-[0.975rem] leading-relaxed text-foreground/70 md:text-base">
                {t.body}
              </p>
            </Reveal>
          </div>

          <div className="process-rail lg:col-span-8">
            <div className="process-rail-track" aria-hidden />
            <div
              className="process-rail-fill"
              aria-hidden
              style={{ ["--process-progress" as string]: String(progress) }}
            />

            <ol ref={listRef} className="relative">
              {t.stages.map((stage, i) => {
                const state =
                  i < active ? "is-done" : i === active ? "is-active" : "";
                return (
                  <li
                    key={stage.index}
                    data-step={i}
                    className={`process-step grid grid-cols-[1.375rem_1fr] items-start gap-x-5 py-3.5 md:gap-x-6 md:py-4 ${state}`}
                  >
                    <span className="process-dot mt-0.5 block shrink-0" aria-hidden />
                    <div className="min-w-0 border-b border-border pb-3.5 md:pb-4">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span
                          className={`font-mono text-xs tabular-nums transition-colors duration-300 ${
                            i <= active ? "text-accent" : "text-muted"
                          }`}
                        >
                          {stage.index}
                        </span>
                        <h3
                          className={`text-base font-medium tracking-tight transition-colors duration-300 md:text-lg ${
                            i === active
                              ? "text-foreground"
                              : i < active
                                ? "text-foreground/75"
                                : "text-foreground/40"
                          }`}
                        >
                          {stage.title}
                        </h3>
                      </div>
                      <p
                        className={`mt-1.5 max-w-md text-sm leading-relaxed transition-opacity duration-300 ${
                          i === active
                            ? "text-muted opacity-100"
                            : "text-muted opacity-50"
                        }`}
                      >
                        {stage.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
