"use client";

import { useId, useState } from "react";
import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "../copy-text";
import { Reveal } from "../reveal";
import { SectionHead } from "../section-head";

export function Faq() {
  const t = useDictionary().faq;
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <SectionHead label={t.label} />

        <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal variant="mask">
              <h2 id="faq-heading" className="type-h2 text-foreground">
                {t.heading}
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <ul className="border-t border-border">
              {t.items.map((item, i) => {
                const isOpen = open === i;
                const panelId = `${baseId}-panel-${i}`;
                const btnId = `${baseId}-btn-${i}`;
                return (
                  <Reveal as="li" variant="fade" key={item.q} delay={i * 0.03}>
                    <h3>
                      <button
                        type="button"
                        id={btnId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="faq-question flex w-full items-center justify-between gap-5 border-b border-border py-4 text-left md:gap-6 md:py-5"
                      >
                        <span className="type-title min-w-0 flex-1 pr-1 text-foreground">
                          {item.q}
                        </span>
                        <span
                          aria-hidden
                          className={`faq-toggle ${isOpen ? "is-open" : ""}`}
                        >
                          <span className="faq-toggle-icon">+</span>
                        </span>
                      </button>
                    </h3>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className={`faq-panel ${isOpen ? "is-open" : ""}`}
                    >
                      <div>
                        <p className="faq-answer type-body-sm max-w-[40rem] pb-7 pt-2 text-muted md:pb-8 md:pt-3">
                          <CopyText>{item.a}</CopyText>
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
