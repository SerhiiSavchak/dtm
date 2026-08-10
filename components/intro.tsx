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

        {/* Statement + explanation on one axis */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h2
                id="intro-heading"
                className="type-h1 max-w-[16ch] text-balance text-foreground"
              >
                {t.headingBefore}{" "}
                <span className="text-accent">{t.headingAccent}</span>
                {t.headingAfter ? ` ${t.headingAfter}` : null}
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <Reveal delay={0.06}>
              <p className="max-w-md type-body-lg text-foreground/70">
                {t.body}
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.08} className="mt-10 md:mt-12">
          <p className="label text-muted">{t.proposition}</p>
        </Reveal>

        {/* Four responsibility areas — number, title, one-line meaning */}
        <div className="mt-5 grid grid-cols-1 border-t border-border sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">
          {t.responsibilities.map((item, i) => (
            <Reveal
              as="div"
              key={item.title}
              delay={0.05 + i * 0.05}
              className="flex flex-col gap-4 border-b border-border py-7 sm:pr-8 xl:border-b-0 xl:py-9 xl:pl-8 xl:first:pl-0"
            >
              <span className="font-mono text-3xl tabular-nums leading-none text-accent md:text-4xl">
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
