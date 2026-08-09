"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { Reveal } from "./reveal";

export function Intro() {
  const t = useDictionary().intro;

  return (
    <section
      id="about"
      aria-labelledby="intro-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <Reveal
          as="div"
          className="flex items-center justify-between border-t border-border pt-4"
        >
          <span className="label text-accent">{t.label}</span>
          <span className="label hidden text-muted sm:block">{t.labelRight}</span>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 md:mt-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h2
                id="intro-heading"
                className="type-h2 font-medium text-balance text-foreground"
              >
                {t.headingBefore}{" "}
                <span className="text-accent">{t.headingAccent}</span>{" "}
                {t.headingAfter}
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:pt-1">
            <Reveal delay={0.08}>
              <p className="max-w-md type-body-lg text-foreground/70">
                {t.body}
              </p>
            </Reveal>
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-1 border-t border-border sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
          {t.responsibilities.map((item, i) => (
            <Reveal
              as="li"
              key={item}
              delay={i * 0.05}
              className="group flex items-baseline gap-5 border-b border-border py-6 md:py-7"
            >
              <span className="font-mono text-xs tabular-nums text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-lg font-medium text-foreground md:text-xl">
                {item}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
