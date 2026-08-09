"use client";

import { useState } from "react";
import Image from "next/image";
import { services } from "@/data/content";
import { Reveal } from "./reveal";

/** Contextual architectural image revealed per active service. */
const serviceImages = [
  "/images/project-01.png",
  "/images/project-02.png",
  "/images/project-04.png",
  "/images/detail-01.png",
];

export function Services() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-ink-deep text-paper"
    >
      <div className="container-dtm py-20 md:py-32">
        <Reveal
          as="div"
          className="flex items-center justify-between border-t border-white/15 pt-4"
        >
          <span className="label text-accent">(03) — Послуги</span>
          <span className="label hidden text-paper/50 sm:block">
            Напрями DTM
          </span>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-x-12 md:mt-14 lg:grid-cols-12">
          {/* Interactive editorial list */}
          <div className="lg:col-span-7">
            <Reveal>
              <h2
                id="services-heading"
                className="mb-10 font-sans font-semibold tracking-[-0.02em] text-balance text-paper md:mb-14"
                style={{ fontSize: "var(--text-h2)", lineHeight: 1.05 }}
              >
                Напрями, з якими працюємо
              </h2>
            </Reveal>

            <ul className="border-t border-white/15">
              {services.map((service, i) => {
                const isActive = active === i;
                return (
                  <li key={service.index}>
                    <a
                      href="#estimate"
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-4 border-b border-white/15 py-7 md:gap-x-8 md:py-9"
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
                          className={`block font-sans font-medium tracking-[-0.01em] text-2xl transition-colors duration-300 md:text-4xl ${
                            isActive ? "text-accent" : "text-paper"
                          }`}
                        >
                          {service.title}
                        </span>
                        <span
                          className={`mt-2 block max-w-md text-sm leading-relaxed transition-colors duration-300 md:text-base ${
                            isActive ? "text-paper/80" : "text-paper/55"
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
                            : "-translate-x-1 text-paper/40 opacity-60"
                        }`}
                      >
                        →
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contextual image — swaps with the active service */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-soft">
                {serviceImages.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="42vw"
                    className={`object-cover transition-opacity duration-700 ease-out ${
                      active === i ? "opacity-100" : "opacity-0"
                    }`}
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
                    {services[active].title}
                  </span>
                  <span className="font-mono text-xs text-accent">
                    {services[active].index}
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
