"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "./copy-text";
import { EstimateCalculator } from "./calculator/estimate-calculator";
import { LightTrace } from "./fx/light-trace";
import { Reveal, RevealGroup } from "./reveal";
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
        <RevealGroup policy="reveal-once">
          <SectionHead label={t.label} right={t.labelRight} />

          <Reveal variant="fade">
          <div className="calc-panel relative overflow-hidden">
            <LightTrace className="absolute left-0 top-0" />

            <div className="grid grid-cols-1 gap-x-12 gap-y-10 p-6 md:p-10 lg:p-14 xl:grid-cols-12 xl:p-16">
              <div className="flex flex-col xl:col-span-4">
                <h2 id="estimate-heading" className="type-h2 text-balance">
                  {t.headingBefore}{" "}
                  <span className="text-accent">{t.headingAccent}</span>
                </h2>
                <p className="calc-muted type-body-lg mt-4 max-w-md">
                  <CopyText>{t.body}</CopyText>
                </p>
                <a
                  href="#contacts"
                  className="label calc-muted arch-link mt-6 xl:mt-auto"
                >
                  <span className="arch-link-label">{t.contactLink}</span>
                </a>
              </div>

              <div className="xl:col-span-8 xl:border-l xl:border-[color:var(--calc-line)] xl:pl-12">
                <EstimateCalculator />
              </div>
            </div>
          </div>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  );
}
