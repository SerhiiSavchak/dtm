"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { heroMedia } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";

/**
 * Videos in /public are all vertical phone clips (720×1280) —
 * weak for desktop full-bleed. Keep still + replaceable video hooks.
 */
export function Hero({ boot = true }: { boot?: boolean }) {
  const t = useDictionary().hero;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const hasVideo = Boolean(heroMedia.webm || heroMedia.mp4);
  const showVideo = hasVideo && !videoFailed;

  useEffect(() => {
    if (!boot) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    const start = () => {
      if (!cancelled) setReady(true);
    };

    if (reduced) {
      const id = window.setTimeout(start, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(id);
      };
    }

    const fallback = window.setTimeout(start, 60);

    if (showVideo && videoRef.current) {
      const el = videoRef.current;
      const tryPlay = async () => {
        try {
          await el.play();
        } catch {
          if (!cancelled) setVideoFailed(true);
        } finally {
          start();
        }
      };
      if (el.readyState >= 2) void tryPlay();
      else {
        el.addEventListener("loadeddata", () => void tryPlay(), { once: true });
        el.addEventListener(
          "error",
          () => {
            if (!cancelled) setVideoFailed(true);
            start();
          },
          { once: true }
        );
      }
    } else {
      start();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [boot, showVideo]);

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
                className="h-full w-full object-cover object-[center_40%]"
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
                quality={90}
                sizes="100vw"
                className="object-cover object-[center_40%] md:object-[center_38%]"
              />
            )}
          </div>
        </div>
        {/* Directional gradient — legibility without flattening the interior */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(13,13,15,0.66) 0%, rgba(13,13,15,0.2) 44%, rgba(13,13,15,0.3) 68%, rgba(13,13,15,0.62) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[38%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,13,15,0) 0%, rgba(13,13,15,0.55) 100%)",
          }}
        />
      </div>

      <div className="relative flex min-h-[100svh] flex-col">
        <div
          className="container-dtm hero-meta flex items-center justify-between text-paper/70"
          style={{
            paddingTop: "calc(var(--header-h) + 0.75rem)",
          }}
        >
          <span className="label">{t.meta}</span>
          <span className="label hidden sm:block">{t.metaRight}</span>
        </div>

        {/* Optical lower-middle: centered flex, biased slightly downward */}
        <div className="container-dtm flex flex-1 flex-col justify-center pb-[clamp(3rem,9vh,6rem)] pt-[clamp(2rem,6vh,4rem)]">
          <div className="mt-[4vh] grid w-full grid-cols-1 gap-y-8 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <div className="lg:col-span-7 xl:col-span-6">
              <h1
                id="hero-heading"
                className="type-display max-w-[12ch] text-paper"
                style={{ lineHeight: 1.02 }}
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
              <p className="hero-copy mt-5 max-w-[28rem] text-[0.975rem] leading-relaxed text-paper/80 md:mt-6 md:text-base md:leading-relaxed">
                {t.copy}
              </p>
            </div>

            {/* CTA cluster — right side, one row, sharing the headline baseline */}
            <div className="hero-cta flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:col-span-5 lg:col-start-8 lg:justify-end lg:pb-1">
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
