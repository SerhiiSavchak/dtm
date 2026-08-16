"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { EstimateCalculator } from "./calculator/estimate-calculator";
import { Reveal } from "./reveal";
import { SectionHead } from "./section-head";

export function EstimateCta() {
  const t = useDictionary().estimate;

  return (
    <section
      id="estimate"
      aria-labelledby="estimate-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <SectionHead label={t.label} right={t.labelRight} />

        <Reveal variant="clip">
          <div className="calc-panel relative overflow-hidden">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-1 w-24 bg-accent"
            />

            <div className="grid grid-cols-1 gap-x-12 gap-y-10 p-6 md:p-10 lg:p-14 xl:grid-cols-12 xl:p-16">
              <div className="flex flex-col xl:col-span-4">
                <h2 id="estimate-heading" className="type-h2 text-balance">
                  {t.headingBefore}{" "}
                  <span className="text-accent">{t.headingAccent}</span>
                </h2>
                <p className="calc-muted type-body-lg mt-4 max-w-md">
                  {t.body}
                </p>
                <a
                  href="#contacts"
                  className="label calc-muted mt-6 inline-block transition-colors hover:text-[var(--calc-fg)] xl:mt-auto xl:pt-10"
                >
                  {t.contactLink}
                </a>
              </div>

              <div className="xl:col-span-8 xl:border-l xl:border-[color:var(--calc-line)] xl:pl-12">
                <EstimateCalculator />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
