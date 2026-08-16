"use client";

import { useEffect, useRef, useState } from "react";
import { inProgressMedia, socialLinks } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "../copy-text";
import { HoverMediaLabel } from "../fx/hover-media-label";
import { InteractiveArrow } from "../fx/interactive-arrow";
import { MediaImage } from "../media-image";
import { RevealGroup } from "../reveal";
import { SectionHead } from "../section-head";
import { InProgressViewer } from "./in-progress-viewer";

const STAGE_QUALITY = 85;
const CARD_SIZES = "(max-width: 1023px) min(82vw, 320px), 310px";
/** Scroll-linked travel per rail, within 80–140px. Rest pose is 0. */
const ROW_SHIFT_PX = 110;
const ROW_TOP = [0, 1, 2] as const;
const ROW_BOTTOM = [3, 4] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function desktopFilmstripMotion() {
  return (
    window.matchMedia("(min-width: 1024px)").matches &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(update: slow)").matches
  );
}

type Copy = ReturnType<typeof useDictionary>["inProgress"];

function InProgressCard({
  index,
  count,
  t,
  onOpen,
}: {
  index: number;
  count: number;
  t: Copy;
  onOpen: (index: number) => void;
}) {
  const item = inProgressMedia[index];
  if (!item) return null;

  return (
    <button
      type="button"
      className="in-progress-card"
      data-index={index}
      aria-haspopup="dialog"
      aria-label={`${t.open}. ${pad2(index + 1)} / ${pad2(count)}. ${
        item.video ? t.videoKind : t.photoKind
      }`}
      onClick={() => onOpen(index)}
    >
      <div className="in-progress-visual">
        <MediaImage
          src={item.src}
          alt={t.mediaAlt}
          fill
          quality={STAGE_QUALITY}
          sizes={CARD_SIZES}
          priority={index === 0 || index === 1}
          className="in-progress-image object-cover"
          style={{ objectPosition: item.objectPosition }}
        />
      </div>
      <span className="in-progress-shade" aria-hidden />
      <HoverMediaLabel label={t.look} />
    </button>
  );
}

export function InProgress() {
  const t = useDictionary().inProgress;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const indexNowRef = useRef<HTMLSpanElement>(null);
  const count = inProgressMedia.length;

  useEffect(() => {
    const section = sectionRef.current;
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!section || !top || !bottom) return;

    let frame = 0;
    let listening = false;
    let intersecting = false;
    let active = desktopFilmstripMotion();

    const paint = () => {
      frame = 0;
      if (!active) {
        top.style.transform = "translate3d(0, 0, 0)";
        bottom.style.transform = "translate3d(0, 0, 0)";
        return;
      }
      const box = section.getBoundingClientRect();
      const view = window.innerHeight || 1;
      const restTop = view * 0.22;
      const travel = Math.max(view * 0.7, box.height * 0.5);
      const progress = Math.min(1, Math.max(0, (restTop - box.top) / travel));
      const shift = progress * ROW_SHIFT_PX;
      top.style.transform = `translate3d(${(-shift).toFixed(2)}px, 0, 0)`;
      bottom.style.transform = `translate3d(${shift.toFixed(2)}px, 0, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    const setListening = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        intersecting = Boolean(entry?.isIntersecting);
        setListening(intersecting && active);
        if (intersecting) onScroll();
      },
      { root: null, threshold: 0 }
    );

    const onChange = () => {
      active = desktopFilmstripMotion();
      if (!active) {
        setListening(false);
        top.style.transform = "translate3d(0, 0, 0)";
        bottom.style.transform = "translate3d(0, 0, 0)";
        return;
      }
      setListening(intersecting && active);
      onScroll();
    };

    io.observe(section);
    onChange();
    window.addEventListener("resize", onChange, { passive: true });

    return () => {
      io.disconnect();
      setListening(false);
      window.removeEventListener("resize", onChange);
      if (frame) window.cancelAnimationFrame(frame);
      top.style.removeProperty("transform");
      bottom.style.removeProperty("transform");
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const now = indexNowRef.current;
    if (!viewport || !now) return;

    const cards = [
      ...viewport.querySelectorAll<HTMLElement>(".in-progress-card[data-index]"),
    ];
    if (cards.length === 0) return;

    const seen = new Map<number, number>();
    const pick = () => {
      let next = 0;
      let best = -1;
      for (const [index, ratio] of seen) {
        if (ratio > best) {
          best = ratio;
          next = index;
        }
      }
      now.textContent = pad2(next + 1);
      viewport.dataset.active = String(next);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index);
          seen.set(index, entry.intersectionRatio);
        }
        pick();
      },
      {
        root: viewport,
        threshold: [0.35, 0.5, 0.72],
      }
    );

    for (const card of cards) io.observe(card);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="in-progress"
      aria-labelledby="in-progress-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm in-progress-head">
        <RevealGroup>
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
        </RevealGroup>
      </div>

      <div ref={viewportRef} className="in-progress-viewport">
        <div ref={topRef} className="in-progress-rail is-top">
          {ROW_TOP.map((index) => (
            <InProgressCard
              key={inProgressMedia[index]?.id ?? index}
              index={index}
              count={count}
              t={t}
              onOpen={setOpenIndex}
            />
          ))}
        </div>
        <div ref={bottomRef} className="in-progress-rail is-bottom">
          {ROW_BOTTOM.map((index) => (
            <InProgressCard
              key={inProgressMedia[index]?.id ?? index}
              index={index}
              count={count}
              t={t}
              onOpen={setOpenIndex}
            />
          ))}
        </div>
      </div>

      <div className="container-dtm in-progress-foot">
        <p className="in-progress-index" aria-live="polite">
          <span ref={indexNowRef} className="in-progress-index-now">
            01
          </span>
          <span className="in-progress-index-line" aria-hidden />
          <span className="in-progress-index-total">{pad2(count)}</span>
        </p>
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
