"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { Reveal } from "./reveal";
import { SectionHead } from "./section-head";

export function Intro() {
  const t = useDictionary().intro;

  return (
    <section
      id="about"
      aria-labelledby="intro-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <SectionHead label={t.label} right={t.labelRight} />

        {/*
          Desktop: adjacent editorial columns (no skipped grid track / empty middle).
          Mobile: stacked, left-aligned.
        */}
        <div className="intro-lead grid grid-cols-1 gap-y-5 md:gap-y-6 lg:grid-cols-12 lg:items-end lg:gap-x-10 xl:gap-x-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h2
                id="intro-heading"
                className="type-h1 max-w-[17ch] text-balance text-foreground"
              >
                {t.headingBefore}{" "}
                <span className="text-accent">{t.headingAccent}</span>
                {t.headingAfter ? ` ${t.headingAfter}` : null}
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-5 lg:pb-1">
            <Reveal delay={0.06}>
              <p className="max-w-[36ch] type-body-lg text-foreground/70 lg:max-w-[34ch]">
                {t.body}
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.08} className="mt-9 md:mt-11">
          <p className="label text-muted">{t.proposition}</p>
        </Reveal>

        {/* Four responsibility areas — number, title, one-line meaning */}
        <div className="mt-4 grid grid-cols-1 border-t border-border sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border md:mt-5">
          {t.responsibilities.map((item, i) => (
            <Reveal
              as="div"
              key={item.title}
              delay={0.05 + i * 0.05}
              className="flex flex-col gap-3.5 border-b border-border py-6 sm:pr-8 md:gap-4 md:py-7 xl:border-b-0 xl:py-8 xl:pl-8 xl:first:pl-0"
            >
              <span className="font-mono text-2xl tabular-nums leading-none text-accent/90 md:text-3xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-medium tracking-tight text-foreground md:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
