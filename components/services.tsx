"use client";

import { useCallback, useId, useState, useSyncExternalStore } from "react";
import { serviceMedia } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "./copy-text";
import { MediaImage } from "./media-image";
import { Reveal } from "./reveal";
import { SectionHead } from "./section-head";
import { CornerFrame } from "./fx/corner-frame";
import { MediaReveal } from "./fx/media-reveal";

function subscribeHoverFine(cb: () => void) {
  const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getHoverFine() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function Services() {
  const t = useDictionary().services;
  const [active, setActive] = useState(0);
  const baseId = useId();
  const hoverFine = useSyncExternalStore(
    subscribeHoverFine,
    getHoverFine,
    () => false
  );

  const activate = useCallback((index: number) => {
    setActive(index);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      activate(Math.min(t.items.length - 1, index + 1));
      document
        .getElementById(
          `${baseId}-tab-${Math.min(t.items.length - 1, index + 1)}`
        )
        ?.focus();
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      activate(Math.max(0, index - 1));
      document.getElementById(`${baseId}-tab-${Math.max(0, index - 1)}`)?.focus();
    }
  };

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <SectionHead label={t.label} right={t.labelRight} />

        <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal variant="mask">
              <h2
                id="services-heading"
                className="mb-6 type-h2 text-balance text-foreground md:mb-8"
              >
                {t.heading}
              </h2>
            </Reveal>

            <MediaReveal
              variant="secondary"
              className="relative mb-8 aspect-[16/10] w-full overflow-hidden bg-stone lg:hidden"
            >
              {serviceMedia.map((src, i) => (
                <div
                  key={src}
                  className="service-media absolute inset-0"
                  data-active={active === i ? "true" : "false"}
                >
                  <MediaImage
                    src={src}
                    alt=""
                    aria-hidden="true"
                    fill
                    quality={75}
                    sizes="(max-width: 1023px) 92vw, 40vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </MediaReveal>

            <ul
              className="border-t border-border"
              role="tablist"
              aria-label={t.heading}
            >
              {t.items.map((service, i) => {
                const isActive = active === i;
                return (
                  <li key={service.index} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      id={`${baseId}-tab-${i}`}
                      aria-selected={isActive}
                      aria-controls={`${baseId}-panel`}
                      tabIndex={isActive ? 0 : -1}
                      onMouseEnter={() => {
                        if (hoverFine) activate(i);
                      }}
                      onFocus={() => activate(i)}
                      onClick={() => activate(i)}
                      onKeyDown={(e) => onKeyDown(e, i)}
                      className="group grid w-full grid-cols-[3rem_1fr_auto] items-baseline gap-x-4 border-b border-border py-5 text-left md:gap-x-8 md:py-6"
                    >
                      <span
                        className={`font-mono text-[0.8125rem] tabular-nums tracking-wide transition-colors duration-300 ${
                          isActive ? "text-accent" : "text-muted"
                        }`}
                      >
                        {service.index}
                      </span>
                      <span>
                        <span
                          className={`type-feature block transition-colors duration-300 ${
                            isActive ? "text-accent" : "text-foreground"
                          }`}
                        >
                          {service.title}
                        </span>
                        <span
                          className={`type-body-sm mt-2.5 block max-w-md transition-colors duration-300 ${
                            isActive ? "text-foreground/75" : "text-muted"
                          }`}
                        >
                          <CopyText>{service.description}</CopyText>
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`self-center transition-[color,transform,opacity] duration-300 ${
                          isActive
                            ? "translate-x-0 text-accent opacity-100"
                            : "-translate-x-1 text-muted opacity-50"
                        }`}
                      >
                        →
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-28">
              <div
                id={`${baseId}-panel`}
                role="tabpanel"
                aria-labelledby={`${baseId}-tab-${active}`}
                className="relative aspect-[4/5] w-full overflow-hidden bg-stone"
              >
                <MediaReveal variant="primary" className="absolute inset-0">
                  <CornerFrame className="absolute inset-0 h-full">
                    {serviceMedia.map((src, i) => (
                      <div
                        key={src}
                        className="service-media absolute inset-0"
                        data-active={active === i ? "true" : "false"}
                      >
                        <MediaImage
                          src={src}
                          alt=""
                          aria-hidden="true"
                          fill
                          quality={75}
                          sizes="(max-width: 1280px) 40vw, 560px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </CornerFrame>
                </MediaReveal>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(13,13,15,0) 0%, rgba(13,13,15,0.75) 100%)",
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                  <span className="label text-paper/90">
                    {t.items[active].title}
                  </span>
                  <span className="font-mono text-xs text-accent">
                    {t.items[active].index}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
