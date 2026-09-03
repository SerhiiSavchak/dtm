"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { heroMedia } from "@/data/media";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-slots";
import { markCriticalReady } from "@/lib/boot-session";
import {
  beginHeroIntro,
  finishHeroIntro,
  getHeroIntroSnapshot,
  getServerHeroIntroSnapshot,
  subscribeHeroIntro,
} from "@/lib/hero-intro";
import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "./copy-text";
import { InteractiveArrow } from "./fx/interactive-arrow";
import { PosterVideo } from "./poster-video";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMobile() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function canUseScrollDepth() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    window.matchMedia("(min-width: 1024px)").matches &&
    !window.matchMedia("(update: slow)").matches
  );
}

/**
 * Media and copy are independent layers. The cinematic intro is a single CSS
 * timeline triggered when the loader yields. Poster readiness starts the loader
 * exit; video decode never restarts the sequence.
 */
export function Hero({ boot = true }: { boot?: boolean }) {
  const t = useDictionary().hero;
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const mobile = useSyncExternalStore(subscribeMobile, getMobile, () => true);
  const heroMp4 = mobile
    ? (heroMedia.mp4Mobile ?? heroMedia.mp4)
    : heroMedia.mp4;
  const intro = useSyncExternalStore(
    subscribeHeroIntro,
    getHeroIntroSnapshot,
    getServerHeroIntroSnapshot
  );
  const heroRef = useRef<HTMLElement>(null);
  const phase = intro.phase;

  useEffect(() => {
    if (reduced) {
      finishHeroIntro();
      return;
    }
    if (boot) beginHeroIntro();
  }, [boot, reduced]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || phase !== "done" || reduced) return;
    if (!canUseScrollDepth()) return;

    let frame = 0;
    let height = el.offsetHeight;

    const paint = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, height * 0.32)));
      el.style.setProperty("--hero-exit", p.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    const onResize = () => {
      height = el.offsetHeight;
      onScroll();
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) window.cancelAnimationFrame(frame);
      el.style.removeProperty("--hero-exit");
    };
  }, [phase, reduced]);

  return (
    <section
      ref={heroRef}
      id="top"
      aria-labelledby="hero-heading"
      data-hero={phase}
      className="relative w-full overflow-hidden bg-ink-deep text-paper"
      style={{
        minHeight: "100svh",
        ["--hero-elapsed" as string]: phase === "play" ? `${intro.elapsed}ms` : "0ms",
      }}
    >
      <div className="hero-media-layer">
        <div className="hero-media">
          <PosterVideo
            poster={heroMedia.poster}
            alt={t.imageAlt}
            mp4={heroMp4}
            webm={heroMedia.webm}
            sizes={IMAGE_SIZES.hero}
            priority
            quality={IMAGE_QUALITY.hero}
            preload="auto"
            className="hero-media-inner"
            imageClassName="object-cover"
            videoClassName="object-cover"
            onPosterReady={markCriticalReady}
          />
        </div>
      </div>

      <div className="hero-aperture" aria-hidden="true">
        <div className="hero-aperture-panel">
          <span className="hero-aperture-cut" />
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
              <span aria-hidden className="hero-meta-rule h-px w-8 bg-accent" />
              <span className="hero-meta-text">{t.meta}</span>
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
                <span className="hero-accent">
                  <span className="hero-accent-fill" data-text={t.line3}>
                    {t.line3}
                  </span>
                  <span className="hero-accent-scanner" aria-hidden="true" />
                </span>
              </span>
            </h1>

            <p className="hero-copy mt-5 text-paper md:mt-6">
              <span className="hero-copy-inner">
                <CopyText>{t.copy}</CopyText>
              </span>
            </p>

            <div className="hero-cta flex flex-col items-start lg:flex-row lg:items-center">
              <a href="#estimate" className="btn btn-primary btn-lg group hero-cta-primary">
                <span className="hero-cta-fill" aria-hidden="true" />
                {t.ctaPrimary}
                <InteractiveArrow />
              </a>
              <a href="#projects" className="btn btn-ghost btn-lg group hero-cta-secondary">
                {t.ctaSecondary}
                <InteractiveArrow />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
