"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { heroMedia } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hero media is layered: the poster paints immediately, the video loads
 * behind the scenes and cross-fades in once it can actually play.
 * Swap the source in data/media.ts — no component changes needed.
 */
export function Hero({ boot = true }: { boot?: boolean }) {
  const t = useDictionary().hero;
  const [ready, setReady] = useState(false);
  const [videoState, setVideoState] = useState<"loading" | "ready" | "failed">(
    "loading"
  );
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);

  const hasVideo = Boolean(heroMedia.webm || heroMedia.mp4);
  const showVideo = hasVideo && !reduced && videoState !== "failed";

  useEffect(() => {
    if (!boot) return;
    const id = window.setTimeout(() => setReady(true), 60);
    return () => window.clearTimeout(id);
  }, [boot]);

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      data-hero={ready ? "ready" : "pending"}
      className="relative w-full overflow-hidden bg-ink-deep text-paper"
      style={{ minHeight: "100svh" }}
    >
      {/* Full-bleed media — never constrained by site container */}
      <div className="hero-media-layer absolute inset-0 h-full w-full">
        <div className="hero-media">
          <div className="hero-media-inner">
            <Image
              src={heroMedia.poster}
              alt={t.imageAlt}
              fill
              priority
              quality={90}
              sizes="100vw"
              className="object-cover object-[center_40%] md:object-[center_38%]"
            />
            {showVideo ? (
              <video
                className={`object-[center_40%] transition-opacity duration-700 ease-out md:object-[center_38%] ${
                  videoState === "ready" ? "opacity-100" : "opacity-0"
                }`}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
                onCanPlay={(e) => {
                  const el = e.currentTarget;
                  el.play()
                    .then(() => setVideoState("ready"))
                    .catch(() => setVideoState("failed"));
                }}
                onError={() => setVideoState("failed")}
              >
                {heroMedia.webm ? (
                  <source src={heroMedia.webm} type="video/webm" />
                ) : null}
                {heroMedia.mp4 ? (
                  <source src={heroMedia.mp4} type="video/mp4" />
                ) : null}
              </video>
            ) : null}
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,13,15,0.34) 0%, rgba(13,13,15,0.1) 38%, rgba(13,13,15,0.16) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(76deg, rgba(13,13,15,0.7) 0%, rgba(13,13,15,0.32) 40%, rgba(13,13,15,0) 66%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,13,15,0) 0%, rgba(13,13,15,0.58) 100%)",
          }}
        />
      </div>

      {/* Content independently containerized — mobile raised toward mid/usable center */}
      <div className="relative flex min-h-[100svh] flex-col justify-center lg:justify-center">
        {/*
          Mobile vertical position lives in globals (.hero-content) so CTA margin
          growth can be compensated — flex justify-center would otherwise lift the title.
        */}
        <div className="container-dtm hero-content w-full pt-[calc(var(--header-h)+1rem)] pb-[clamp(2.75rem,10svh,5rem)] lg:pb-[clamp(1.5rem,3svh,2.5rem)] lg:pt-[calc(var(--header-h)+0.25rem)]">
          <div className="hero-cluster max-w-[46rem] lg:max-w-[48rem] xl:max-w-[50rem] 2xl:max-w-[52rem]">
            <p className="hero-meta label flex items-center gap-3 text-paper/75">
              <span aria-hidden className="h-px w-8 bg-accent" />
              {t.meta}
            </p>

            <h1
              id="hero-heading"
              className="hero-heading type-display mt-4 max-w-[12ch] text-paper md:mt-6 lg:max-w-[13ch] xl:max-w-[13.5ch]"
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

            <p className="hero-copy mt-4 max-w-[33rem] text-[0.975rem] leading-relaxed text-paper/85 md:mt-6 md:text-base md:leading-relaxed lg:max-w-[36rem] xl:max-w-[38rem] xl:text-[1.0625rem] 2xl:text-[1.125rem]">
              {t.copy}
            </p>

            {/* Spacing: .hero-cta margin in globals.css (mobile only). Do not override with mt-* here. */}
            <div className="hero-cta flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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
