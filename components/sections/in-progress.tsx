"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  inProgressFrames,
  inProgressMedia,
  inProgressMediaIndex,
  inProgressScenes,
  socialLinks,
  type InProgressItem,
  type InProgressScene,
} from "@/data/media";
import { preloadSiteImage } from "@/lib/media-preload";
import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "../copy-text";
import { HoverMediaLabel } from "../fx/hover-media-label";
import { InteractiveArrow } from "../fx/interactive-arrow";
import { MediaImage } from "../media-image";
import { SectionHead } from "../section-head";
import { InProgressViewer } from "./in-progress-viewer";

const STAGE_QUALITY = 85;
const DESKTOP_MQ = "(min-width: 1024px)";
const HERO_SIZES =
  "(max-width: 1023px) 92vw, min(42vw, 38rem)";
const SIDE_SIZES =
  "(max-width: 1023px) 46vw, min(22vw, 20rem)";
const VIDEO_SIZES = HERO_SIZES;
const HYSTERESIS = 0.22;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

type Copy = ReturnType<typeof useDictionary>["inProgress"];

function ObjectVideo({
  item,
  alt,
  active,
  sizes,
  priority,
}: {
  item: InProgressItem;
  alt: string;
  active: boolean;
  sizes: string;
  priority?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !item.video) return;
    el.muted = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!active || reduce || document.hidden) {
      el.pause();
      return;
    }
    const tryPlay = () => {
      if (el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      el.play().catch(() => {});
    };
    tryPlay();
    el.addEventListener("canplay", tryPlay);
    const onVis = () => {
      if (document.hidden) el.pause();
      else tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      el.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", onVis);
      el.pause();
    };
  }, [active, item.video]);

  return (
    <div className="in-progress-video">
      <MediaImage
        src={item.src}
        alt={alt}
        fill
        quality={STAGE_QUALITY}
        sizes={sizes}
        priority={priority}
        className="in-progress-image object-cover"
        style={{ objectPosition: item.objectPosition }}
      />
      {item.video ? (
        <video
          ref={videoRef}
          className="in-progress-video-el"
          muted
          loop
          playsInline
          preload="metadata"
          poster={item.src}
          style={{ objectPosition: item.objectPosition }}
        >
          <source src={item.video} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}

function FrameButton({
  item,
  t,
  sizes,
  onOpen,
  className,
  active,
  priority,
}: {
  item: InProgressItem;
  t: Copy;
  sizes: string;
  onOpen: () => void;
  className?: string;
  active: boolean;
  priority?: boolean;
}) {
  const index = inProgressMediaIndex(item.id);
  const kind = item.video ? t.videoKind : t.photoKind;
  return (
    <button
      type="button"
      className={`in-progress-frame ${className ?? ""}`}
      aria-haspopup="dialog"
      aria-label={`${t.open}. ${pad2(index + 1)} / ${pad2(inProgressMedia.length)}. ${kind}`}
      onClick={onOpen}
    >
      <div className="in-progress-visual">
        {item.video ? (
          <ObjectVideo
            item={item}
            alt={t.mediaAlt}
            active={active}
            sizes={sizes}
            priority={priority}
          />
        ) : (
          <MediaImage
            src={item.src}
            alt={t.mediaAlt}
            fill
            quality={STAGE_QUALITY}
            sizes={sizes}
            priority={priority}
            className="in-progress-image object-cover"
            style={{ objectPosition: item.objectPosition }}
          />
        )}
      </div>
      <span className="in-progress-shade" aria-hidden />
      <HoverMediaLabel label={t.look} />
    </button>
  );
}

function SceneComposition({
  scene,
  t,
  active,
  eager,
  onOpen,
}: {
  scene: InProgressScene;
  t: Copy;
  active: boolean;
  eager: boolean;
  onOpen: (mediaIndex: number) => void;
}) {
  const frames = inProgressFrames(scene);
  const hero = frames[0];
  const sides = frames.slice(1, 3);
  if (!hero) return null;

  return (
    <div className={`in-progress-comp is-${scene.layout}`}>
      <FrameButton
        item={hero}
        t={t}
        sizes={hero.video ? VIDEO_SIZES : HERO_SIZES}
        className="in-progress-hero"
        active={active}
        priority={eager}
        onOpen={() => onOpen(inProgressMediaIndex(hero.id))}
      />
      {sides.length > 0 ? (
        <div className="in-progress-side">
          {sides.map((item, index) => (
            <FrameButton
              key={item.id}
              item={item}
              t={t}
              sizes={SIDE_SIZES}
              className={index === 0 ? "in-progress-side-a" : "in-progress-side-b"}
              active={active}
              onOpen={() => onOpen(inProgressMediaIndex(item.id))}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function IntroCopy({ t }: { t: Copy }) {
  return (
    <>
      <SectionHead label={t.label} right={t.labelRight} />
      <div className="in-progress-intro">
        <h2 id="in-progress-heading" className="type-h2 text-foreground">
          {t.heading}
        </h2>
        <div className="in-progress-intro-copy">
          <p className="type-body-lg in-progress-body">
            <CopyText>{t.body}</CopyText>
          </p>
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-text group mt-5 text-foreground"
          >
            <span className="btn-text-label">{t.instagramCta}</span>
            <InteractiveArrow />
          </a>
        </div>
      </div>
    </>
  );
}

export function InProgress() {
  const t = useDictionary().inProgress;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeScene, setActiveScene] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const nowRef = useRef<HTMLSpanElement>(null);
  const kindRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const count = inProgressScenes.length;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const fill = fillRef.current;
    const now = nowRef.current;
    const kind = kindRef.current;
    if (!section || !pin) return;

    const mq = window.matchMedia(DESKTOP_MQ);
    let raf = 0;
    let armed = false;
    let io: IntersectionObserver | null = null;

    const sceneKind = (index: number) => {
      const frames = inProgressFrames(inProgressScenes[index]!);
      return frames.some((item) => item.video) ? t.videoKind : t.photoKind;
    };

    const applyScene = (index: number) => {
      if (now) now.textContent = pad2(index + 1);
      if (kind) kind.textContent = sceneKind(index);
      section.dataset.scene = String(index);
      if (activeRef.current !== index) {
        activeRef.current = index;
        setActiveScene(index);
      }
    };

    const pickFromProgress = (progress: number, current: number) => {
      const x = progress * count;
      const lo = current - HYSTERESIS;
      const hi = current + 1 + HYSTERESIS;
      if (x >= hi) return Math.min(count - 1, Math.floor(x - HYSTERESIS));
      if (x < lo) return Math.max(0, Math.floor(x + HYSTERESIS));
      return current;
    };

    const stopIo = () => {
      io?.disconnect();
      io = null;
    };

    const startIo = () => {
      if (io) return;
      const nodes = [
        ...section.querySelectorAll<HTMLElement>(".in-progress-scene[data-index]"),
      ];
      if (nodes.length === 0) return;
      const seen = new Map<number, number>();
      io = new IntersectionObserver(
        (entries) => {
          if (mq.matches) return;
          for (const entry of entries) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            seen.set(index, entry.intersectionRatio);
          }
          let next = activeRef.current;
          let best = 0.35;
          for (const [index, ratio] of seen) {
            if (ratio > best) {
              best = ratio;
              next = index;
            }
          }
          applyScene(next);
        },
        { threshold: [0.35, 0.55, 0.75] }
      );
      for (const node of nodes) io.observe(node);
    };

    const measureDesktop = () => {
      const headerEl = document.querySelector(".site-header");
      const header = headerEl?.getBoundingClientRect().height || 80;
      const stageH = Math.max(240, window.innerHeight - header - 24);
      const travel = Math.max(1, pin.offsetHeight - stageH);
      const top = pin.getBoundingClientRect().top;
      const scrolled = Math.min(travel, Math.max(0, header - top));
      const progress = scrolled / travel;
      if (fill) fill.style.transform = `scaleX(${progress})`;
      applyScene(pickFromProgress(progress, activeRef.current));
    };

    const syncMode = () => {
      if (mq.matches) {
        stopIo();
        if (!armed) {
          section.dataset.armed = "";
          armed = true;
        }
        measureDesktop();
        return;
      }
      if (armed) {
        delete section.dataset.armed;
        armed = false;
      }
      if (fill) fill.style.transform = "scaleX(0)";
      startIo();
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        if (mq.matches) measureDesktop();
      });
    };

    applyScene(0);
    syncMode();
    mq.addEventListener("change", syncMode);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      mq.removeEventListener("change", syncMode);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      stopIo();
      if (raf) window.cancelAnimationFrame(raf);
      delete section.dataset.armed;
    };
  }, [count, t.photoKind, t.videoKind]);

  useEffect(() => {
    const current = inProgressScenes[activeScene];
    const next = inProgressScenes[activeScene + 1];
    const sizes = HERO_SIZES;
    if (current) {
      inProgressFrames(current).forEach((item) => {
        void preloadSiteImage(item.src, { sizes, quality: STAGE_QUALITY });
      });
    }
    if (next) {
      inProgressFrames(next).forEach((item) => {
        void preloadSiteImage(item.src, { sizes, quality: STAGE_QUALITY });
      });
    }
  }, [activeScene]);

  return (
    <section
      ref={sectionRef}
      id="in-progress"
      aria-labelledby="in-progress-heading"
      className="in-progress bg-bg text-foreground"
      style={{ "--in-progress-count": count } as CSSProperties}
      data-scene="0"
    >
      <div className="container-dtm in-progress-shell">
        <div ref={pinRef} className="in-progress-pin">
          <div className="in-progress-stage">
            <div className="in-progress-rail">
              <IntroCopy t={t} />
              <div className="in-progress-status" aria-live="polite">
                <span className="in-progress-progress" aria-hidden>
                  <span ref={fillRef} className="in-progress-progress-fill" />
                </span>
                <p className="in-progress-status-row">
                  <span ref={nowRef} className="in-progress-status-now">
                    01
                  </span>
                  <span className="in-progress-status-rule" aria-hidden />
                  <span className="in-progress-status-total">{pad2(count)}</span>
                </p>
                <p className="in-progress-status-kind">
                  <span className="in-progress-status-label">{t.label}</span>
                  <span aria-hidden className="in-progress-status-sep">
                    ·
                  </span>
                  <span ref={kindRef}>{t.photoKind}</span>
                </p>
              </div>
            </div>

            <div className="in-progress-canvas">
              {inProgressScenes.map((scene, index) => {
                const frames = inProgressFrames(scene);
                const kind = frames.some((item) => item.video)
                  ? t.videoKind
                  : t.photoKind;
                const active = index === activeScene;
                return (
                  <article
                    key={scene.id}
                    className={`in-progress-scene ${active ? "is-active" : ""}`}
                    data-index={index}
                    aria-current={active ? "true" : undefined}
                  >
                    <div className="in-progress-chapter-meta">
                      <p className="in-progress-chapter-index">
                        {pad2(index + 1)}
                        <span aria-hidden className="in-progress-status-rule" />
                        {pad2(count)}
                      </p>
                      <p className="in-progress-chapter-kind">
                        <span className="in-progress-status-label">{t.label}</span>
                        <span aria-hidden className="in-progress-status-sep">
                          ·
                        </span>
                        <span>{kind}</span>
                      </p>
                    </div>
                    <SceneComposition
                      scene={scene}
                      t={t}
                      active={active}
                      eager={index === 0}
                      onOpen={setOpenIndex}
                    />
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {openIndex != null ? (
        <InProgressViewer
          items={inProgressMedia}
          index={openIndex}
          alt={t.mediaAlt}
          galleryLabel={t.gallery}
          closeLabel={t.close}
          prevLabel={t.prev}
          nextLabel={t.next}
          playLabel={t.play}
          pauseLabel={t.pause}
          onClose={() => setOpenIndex(null)}
          onIndex={setOpenIndex}
        />
      ) : null}
    </section>
  );
}
