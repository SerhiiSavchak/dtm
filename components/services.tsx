"use client";

import {
  useCallback,
  useId,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { serviceMedia } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "./copy-text";
import { MediaImage } from "./media-image";
import { Reveal, RevealGroup } from "./reveal";
import { SectionHead } from "./section-head";
import { CornerFrame } from "./fx/corner-frame";

function subscribeHoverFine(cb: () => void) {
  const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getHoverFine() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function mediaFor(index: number) {
  return serviceMedia[index] ?? serviceMedia[0];
}

function ServiceStills({
  active,
  titles,
  sizes,
}: {
  active: number;
  titles: readonly string[];
  sizes: string;
}) {
  return titles.map((title, i) => {
    const media = mediaFor(i);
    const isActive = active === i;
    return (
      <div
        key={`${media.src}-${i}`}
        className="service-media absolute inset-0"
        data-active={isActive ? "true" : "false"}
        style={{ "--service-pos": media.objectPosition } as CSSProperties}
      >
        <MediaImage
          src={media.src}
          alt={isActive ? title : ""}
          aria-hidden={isActive ? undefined : true}
          fill
          quality={75}
          sizes={sizes}
          className="object-cover"
        />
      </div>
    );
  });
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

  const lastIndex = Math.max(0, t.items.length - 1);
  const activeIndex = Math.min(Math.max(0, active), lastIndex);
  const titles = t.items.map((item) => item.title);

  const activate = useCallback((index: number) => {
    setActive(index);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = Math.min(lastIndex, index + 1);
      activate(next);
      document.getElementById(`${baseId}-tab-${next}`)?.focus();
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = Math.max(0, index - 1);
      activate(prev);
      document.getElementById(`${baseId}-tab-${prev}`)?.focus();
    }
  };

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <RevealGroup>
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

            <div className="services-inline-media">
              <ServiceStills
                active={activeIndex}
                titles={titles}
                sizes="(max-width: 1023px) 92vw, 40vw"
              />
            </div>

            <ul
              className="border-t border-border"
              role="tablist"
              aria-label={t.heading}
            >
              {t.items.map((service, i) => {
                const isActive = activeIndex === i;
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

          <div className="services-sticky-col">
            <div className="sticky top-28">
              <div
                id={`${baseId}-panel`}
                role="tabpanel"
                aria-labelledby={`${baseId}-tab-${activeIndex}`}
                className="services-sticky-frame"
              >
                <div className="services-media-stack">
                  <ServiceStills
                    active={activeIndex}
                    titles={titles}
                    sizes="(max-width: 1280px) 40vw, 560px"
                  />
                </div>
                <div className="services-contrast" aria-hidden />
                <div className="services-caption">
                  <span className="label text-paper/90">
                    {t.items[activeIndex]?.title}
                  </span>
                </div>
                <CornerFrame className="services-deco" />
              </div>
            </div>
          </div>
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}
