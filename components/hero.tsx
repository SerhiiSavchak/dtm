"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { heroMedia } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";

/**
 * Video-first hero with trivial source swap via `data/media.ts`.
 * Poster/Image keeps composition stable when video is unavailable.
 */
export function Hero() {
  const t = useDictionary().hero;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const hasVideo = Boolean(heroMedia.webm || heroMedia.mp4);
  const showVideo = hasVideo && !videoFailed;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = () => setReady(true);

    if (reduced) {
      start();
      return;
    }

    // Kick the entrance quickly — don't wait on media decode forever
    const fallback = window.setTimeout(start, 120);

    if (showVideo && videoRef.current) {
      const el = videoRef.current;
      const tryPlay = async () => {
        try {
          await el.play();
        } catch {
          setVideoFailed(true);
        } finally {
          start();
        }
      };
      if (el.readyState >= 2) {
        void tryPlay();
      } else {
        el.addEventListener("loadeddata", () => void tryPlay(), { once: true });
        el.addEventListener(
          "error",
          () => {
            setVideoFailed(true);
            start();
          },
          { once: true }
        );
      }
    } else {
      start();
    }

    return () => window.clearTimeout(fallback);
  }, [showVideo]);

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      data-hero={ready ? "ready" : "pending"}
      className="relative w-full overflow-hidden bg-ink-deep text-paper"
      style={{ minHeight: "100svh" }}
    >
      <div className="absolute inset-0">
        <div className="hero-media absolute inset-0">
          <div className="hero-media-inner absolute inset-0">
            {showVideo ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover object-[center_center] md:object-[center_40%]"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={heroMedia.poster}
                aria-hidden="true"
                onError={() => setVideoFailed(true)}
              >
                {heroMedia.webm ? (
                  <source src={heroMedia.webm} type="video/webm" />
                ) : null}
                {heroMedia.mp4 ? (
                  <source src={heroMedia.mp4} type="video/mp4" />
                ) : null}
              </video>
            ) : (
              <Image
                src={heroMedia.poster}
                alt={t.imageAlt}
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_center] md:object-[center_40%]"
              />
            )}
          </div>
        </div>

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,13,15,0.58) 0%, rgba(13,13,15,0.12) 34%, rgba(13,13,15,0.28) 58%, rgba(13,13,15,0.84) 100%)",
          }}
        />
      </div>

      <div className="relative flex min-h-[100svh] flex-col">
        <div
          className="container-dtm hero-meta flex items-center justify-between text-paper/70"
          style={{
            paddingTop: "calc(var(--header-h) + clamp(0.75rem, 2.5vh, 1.75rem))",
          }}
        >
          <span className="label">{t.meta}</span>
          <span className="label hidden sm:block">{t.metaRight}</span>
        </div>

        <div className="container-dtm mt-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 md:pb-14">
          <h1 id="hero-heading" className="type-display text-balance text-paper">
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

          <div className="mt-7 grid grid-cols-1 gap-x-10 gap-y-7 lg:grid-cols-12 lg:items-end md:mt-8">
            <p className="hero-copy max-w-md type-body-lg text-paper/80 lg:col-span-6">
              {t.copy}
            </p>

            <div className="hero-cta flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:col-span-6 lg:justify-end">
              <a href="#estimate" className="btn btn-primary">
                {t.ctaPrimary}
              </a>
              <a href="#projects" className="btn btn-ghost group">
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
