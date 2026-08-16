"use client";

import { useEffect, useState } from "react";
import { heroMedia } from "@/data/media";
import { markCriticalReady } from "@/lib/boot-session";
import { useDictionary } from "@/lib/i18n/locale-context";
import { PosterVideo } from "./poster-video";

/**
 * Media and copy are independent layers. Copy is always in the DOM and visible
 * in CSS; `boot` only times an optional settle after the loader.
 */
export function Hero({ boot = true }: { boot?: boolean }) {
  const t = useDictionary().hero;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (entered) return;
    if (boot) {
      const id = window.setTimeout(() => setEntered(true), 40);
      return () => window.clearTimeout(id);
    }
    const fallback = window.setTimeout(() => setEntered(true), 3000);
    return () => window.clearTimeout(fallback);
  }, [boot, entered]);

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      data-hero={entered ? "ready" : "pending"}
      className="relative w-full overflow-hidden bg-ink-deep text-paper"
      style={{ minHeight: "100svh" }}
    >
      <div className="hero-media-layer">
        <div className="hero-media">
          <PosterVideo
            poster={heroMedia.poster}
            alt={t.imageAlt}
            mp4={heroMedia.mp4}
            webm={heroMedia.webm}
            sizes="100vw"
            priority
            quality={90}
            preload="auto"
            className="hero-media-inner"
            imageClassName="object-cover"
            videoClassName="object-cover"
            onPosterReady={markCriticalReady}
          />
        </div>
      </div>

      <div className="hero-contrast" aria-hidden="true">
        <div className="hero-contrast-tint" />
        <div className="hero-contrast-top" />
        <div className="hero-contrast-copy" />
        <div className="hero-contrast-floor" />
      </div>

      <div className="hero-copy-layer relative flex min-h-[100svh] flex-col justify-center lg:justify-center">
        <div className="container-dtm hero-content w-full pt-[calc(var(--header-h)+1rem)] pb-[clamp(2.75rem,10svh,5rem)] lg:pb-[clamp(1.5rem,3svh,2.5rem)] lg:pt-[calc(var(--header-h)+0.25rem)]">
          <div className="hero-cluster max-w-[46rem] lg:max-w-[48rem] xl:max-w-[50rem] 2xl:max-w-[52rem]">
            <p className="hero-meta label flex items-center gap-3 text-paper/90">
              <span aria-hidden className="h-px w-8 bg-accent" />
              {t.meta}
            </p>

            <h1
              id="hero-heading"
              className="hero-heading type-display mt-4 max-w-[12ch] text-paper md:mt-6 lg:max-w-[14ch] xl:max-w-[15ch]"
            >
              <span className="mask-line hero-line-1">
                <span>{t.line1}</span>
              </span>
              <span className="mask-line hero-line-2">
                <span>{t.line2}</span>
              </span>
              <span className="mask-line hero-line-3">
                <span className="text-accent">{t.line3}</span>
              </span>
            </h1>

            <p className="hero-copy mt-5 text-paper md:mt-6">
              {t.copy}
            </p>

            <div className="hero-cta flex flex-col items-start lg:flex-row lg:items-center">
              <a href="#estimate" className="btn btn-primary btn-lg group">
                {t.ctaPrimary}
                <span className="btn-arrow" aria-hidden>
                  →
                </span>
              </a>
              <a href="#projects" className="btn btn-ghost btn-lg group">
                {t.ctaSecondary}
                <span className="btn-arrow" aria-hidden>
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
