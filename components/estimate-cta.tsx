"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { EstimateCalculator } from "./calculator/estimate-calculator";
import { Reveal } from "./reveal";

export function EstimateCta() {
  const t = useDictionary().estimate;

  return (
    <section
      id="estimate"
      aria-labelledby="estimate-heading"
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

        <Reveal variant="clip" className="mt-10 md:mt-12">
          <div className="relative overflow-hidden bg-ink-deep text-paper">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-1 w-24 bg-accent"
            />

            <div className="grid grid-cols-1 gap-x-10 gap-y-12 p-7 md:p-12 lg:grid-cols-12 lg:p-16">
              <div className="lg:col-span-5">
                <h2
                  id="estimate-heading"
                  className="type-h1 text-balance text-paper"
                >
                  {t.headingBefore}{" "}
                  <span className="text-accent">{t.headingAccent}</span>
                </h2>
                <p className="mt-5 max-w-md type-body-lg text-paper/75">
                  {t.body}
                </p>
                <a
                  href="#contacts"
                  className="label mt-8 inline-block text-paper/55 transition-colors hover:text-paper"
                >
                  {t.contactLink}
                </a>
              </div>

              <div className="lg:col-span-7 lg:border-l lg:border-white/10 lg:pl-10">
                <EstimateCalculator />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
