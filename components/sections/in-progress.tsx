"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  inProgressComposition,
  inProgressMedia,
  inProgressMediaIndex,
  socialLinks,
  type InProgressItem,
  type InProgressPanel,
} from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "../copy-text";
import { HoverMediaLabel } from "../fx/hover-media-label";
import { InteractiveArrow } from "../fx/interactive-arrow";
import { MediaImage } from "../media-image";
import { Reveal, RevealGroup } from "../reveal";
import { SectionHead } from "../section-head";
import { InProgressViewer } from "./in-progress-viewer";

const STAGE_QUALITY = 85;
const REDUCE_MQ = "(prefers-reduced-motion: reduce)";

const PANEL_SIZES: Record<InProgressPanel, string> = {
  wide: "(max-width: 767px) 48vw, (max-width: 1023px) 38vw, min(32vw, 28rem)",
  portrait:
    "(max-width: 767px) 48vw, (max-width: 1023px) 32vw, min(24vw, 22rem)",
  narrow: "(max-width: 767px) 42vw, (max-width: 1023px) 24vw, min(16vw, 14rem)",
  video: "(max-width: 767px) 48vw, (max-width: 1023px) 28vw, min(18vw, 20rem)",
};

type Copy = ReturnType<typeof useDictionary>["inProgress"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

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
    const reduce = window.matchMedia(REDUCE_MQ).matches;
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

function MediaPanel({
  item,
  index,
  t,
  active,
  priority,
  onOpen,
}: {
  item: InProgressItem;
  index: number;
  t: Copy;
  active: boolean;
  priority?: boolean;
  onOpen: () => void;
}) {
  const mediaIndex = inProgressMediaIndex(item.id);
  const kind = item.video ? t.videoKind : t.photoKind;
  const sizes = PANEL_SIZES[item.panel];
  return (
    <button
      type="button"
      className={`in-progress-panel is-${item.panel}`}
      style={{ "--i": index } as CSSProperties}
      aria-haspopup="dialog"
      aria-label={`${t.open}. ${pad2(mediaIndex + 1)} / ${pad2(inProgressMedia.length)}. ${kind}`}
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
      <HoverMediaLabel label={t.look} />
    </button>
  );
}

export function InProgress() {
  const t = useDictionary().inProgress;
  const frames = inProgressComposition();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const reduce = window.matchMedia(REDUCE_MQ).matches;
    if (reduce) {
      board.classList.add("is-open");
      return;
    }

    board.classList.add("is-armed");
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (entry.intersectionRatio < 0.32) return;
        board.classList.add("is-open");
        setOpen(true);
        io.disconnect();
      },
      { threshold: [0.32, 0.45] }
    );
    io.observe(board);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || !open) return;
    const onEnd = () => board.classList.remove("is-animating");
    board.classList.add("is-animating");
    board.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(onEnd, 1400);
    return () => {
      board.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [open]);

  return (
    <section
      id="in-progress"
      aria-labelledby="in-progress-heading"
      className="in-progress bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <RevealGroup>
          <SectionHead label={t.label} right={t.labelRight} />
          <div className="in-progress-intro">
            <Reveal variant="rise">
              <h2 id="in-progress-heading" className="type-h2 text-foreground">
                {t.heading}
              </h2>
            </Reveal>
            <Reveal variant="fade" delay={0.08}>
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
            </Reveal>
          </div>
        </RevealGroup>

        <div ref={boardRef} className="in-progress-board">
          {frames.map((item, index) => (
            <MediaPanel
              key={item.id}
              item={item}
              index={index}
              t={t}
              active={open && Boolean(item.video)}
              priority={index === 0}
              onOpen={() => setOpenIndex(inProgressMediaIndex(item.id))}
            />
          ))}
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
