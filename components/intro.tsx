"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "./copy-text";
import { Reveal, RevealGroup } from "./reveal";
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
        <RevealGroup>
          {/* Eyebrow only — “Модель роботи” lives with the right-hand column */}
          <SectionHead label={t.label} />

          {/*
            Desktop (lg+): editorial two-anchor grid
            heading ~1–5 · intentional void ~6–8 · copy ~9–12
            Mobile: stacked left-aligned
          */}
          <div className="intro-lead grid grid-cols-1 gap-y-5 md:gap-y-6 lg:grid-cols-12 lg:items-end lg:gap-x-6 xl:gap-x-8">
            <div className="lg:col-span-5">
              <Reveal variant="mask">
                <h2
                  id="intro-heading"
                  className="type-h1 max-w-[21ch] text-balance text-foreground lg:max-w-[16ch]"
                >
                  {t.headingBefore}{" "}
                  <span className="text-accent">{t.headingAccent}</span>
                  {t.headingAfter ? ` ${t.headingAfter}` : null}
                </h2>
              </Reveal>
            </div>

            <div className="intro-lead-aside lg:col-span-4 lg:col-start-9">
              <Reveal variant="fade" delay={0.08}>
                <p className="label mb-3 text-muted lg:mb-4">{t.labelRight}</p>
                <p className="intro-lead-copy text-left text-foreground/70">
                  <CopyText>{t.body}</CopyText>
                </p>
              </Reveal>
            </div>
          </div>
        </RevealGroup>

        <Reveal variant="fade" delay={0.1} className="mt-9 md:mt-11 lg:mt-12">
          <p className="label text-muted">{t.proposition}</p>
        </Reveal>

        {/* Four responsibility areas — preserved structure */}
        <div className="mt-4 grid grid-cols-1 border-t border-border sm:grid-cols-2 md:mt-5 xl:grid-cols-4 xl:divide-x xl:divide-border">
          {t.responsibilities.map((item, i) => (
            <Reveal
              as="div"
              variant="fade"
              key={item.title}
              delay={0.05 + i * 0.05}
              className="flex flex-col items-center gap-3.5 border-b border-border py-6 text-center md:gap-4 md:py-7 lg:items-start lg:pr-8 lg:text-left xl:border-b-0 xl:py-8 xl:pl-8 xl:first:pl-0"
            >
              <span className="font-mono text-[1.75rem] tabular-nums leading-none text-accent/90 md:text-3xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex w-full flex-col items-center lg:items-start">
                <h3 className="type-title text-foreground">
                  {item.title}
                </h3>
                <p className="type-body-sm mt-2.5 max-w-none text-muted lg:max-w-[28ch]">
                  <CopyText>{item.text}</CopyText>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
