"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import { serviceMedia } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { Reveal } from "./reveal";

export function Services() {
  const t = useDictionary().services;
  const [active, setActive] = useState(0);
  const baseId = useId();

  // Preload service stills once mounted
  useEffect(() => {
    serviceMedia.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  const activate = useCallback((index: number) => {
    setActive(index);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      activate(Math.min(t.items.length - 1, index + 1));
      document.getElementById(`${baseId}-tab-${Math.min(t.items.length - 1, index + 1)}`)?.focus();
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
      className="bg-ink-deep text-paper"
    >
      <div className="container-dtm section-pad">
        <Reveal
          as="div"
          className="flex items-center justify-between border-t border-white/15 pt-4"
        >
          <span className="label text-accent">{t.label}</span>
          <span className="label hidden text-paper/50 sm:block">
            {t.labelRight}
          </span>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-x-12 md:mt-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h2
                id="services-heading"
                className="mb-8 type-h2 text-balance text-paper md:mb-12"
              >
                {t.heading}
              </h2>
            </Reveal>

            {/* Mobile media frame — tap-driven */}
            <div className="relative mb-8 aspect-[16/10] w-full overflow-hidden bg-ink-soft lg:hidden">
              {serviceMedia.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="100vw"
                  className="service-media object-cover"
                  data-active={active === i ? "true" : "false"}
                />
              ))}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink-deep/80 to-transparent p-4">
                <span className="label text-paper/90">
                  {t.items[active].title}
                </span>
                <span className="font-mono text-xs text-accent">
                  {t.items[active].index}
                </span>
              </div>
            </div>

            <ul
              className="border-t border-white/15"
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
                      onMouseEnter={() => activate(i)}
                      onFocus={() => activate(i)}
                      onClick={() => activate(i)}
                      onKeyDown={(e) => onKeyDown(e, i)}
                      className="group grid w-full grid-cols-[3rem_1fr_auto] items-baseline gap-x-4 border-b border-white/15 py-6 text-left md:gap-x-8 md:py-8"
                    >
                      <span
                        className={`font-mono text-xs tabular-nums transition-colors duration-300 ${
                          isActive ? "text-accent" : "text-paper/45"
                        }`}
                      >
                        {service.index}
                      </span>
                      <span>
                        <span
                          className={`block font-sans font-medium tracking-[-0.01em] text-xl transition-colors duration-300 md:text-3xl lg:text-4xl ${
                            isActive ? "text-accent" : "text-paper"
                          }`}
                        >
                          {service.title}
                        </span>
                        <span
                          className={`mt-2 block max-w-md text-sm leading-relaxed transition-[color,max-height,opacity] duration-300 md:text-base ${
                            isActive
                              ? "text-paper/80"
                              : "text-paper/45 md:text-paper/55"
                          }`}
                        >
                          {service.description}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`self-center transition-all duration-300 ${
                          isActive
                            ? "translate-x-0 text-accent opacity-100"
                            : "-translate-x-1 text-paper/40 opacity-50"
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
                className="relative aspect-[4/5] w-full overflow-hidden bg-ink-soft"
              >
                {serviceMedia.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="42vw"
                    className="service-media object-cover"
                    data-active={active === i ? "true" : "false"}
                    priority={i === 0}
                  />
                ))}
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
