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

            <div className="grid grid-cols-1 gap-x-12 gap-y-10 p-6 md:p-10 lg:grid-cols-12 lg:p-14 xl:p-16">
              <div className="flex flex-col lg:col-span-4">
                <h2
                  id="estimate-heading"
                  className="type-h2 text-balance text-paper"
                >
                  {t.headingBefore}{" "}
                  <span className="text-accent">{t.headingAccent}</span>
                </h2>
                <p className="mt-4 max-w-md text-[0.975rem] leading-relaxed text-paper/75 md:text-base">
                  {t.body}
                </p>
                <a
                  href="#contacts"
                  className="label mt-6 inline-block text-paper/55 transition-colors hover:text-paper lg:mt-auto lg:pt-10"
                >
                  {t.contactLink}
                </a>
              </div>

              <div className="lg:col-span-8 lg:border-l lg:border-white/10 lg:pl-12">
                <EstimateCalculator />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
