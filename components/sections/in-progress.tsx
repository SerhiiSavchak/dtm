"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
} from "react";
import {
  inProgressComposition,
  inProgressMedia,
  inProgressMediaIndex,
  socialLinks,
  type InProgressItem,
} from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { IMAGE_QUALITY } from "@/lib/image-slots";
import { CopyText } from "../copy-text";
import { InteractiveArrow } from "../fx/interactive-arrow";
import { MediaImage } from "../media-image";
import { Reveal, RevealGroup } from "../reveal";
import { SectionHead } from "../section-head";
import { InProgressViewer } from "./in-progress-viewer";

const STAGE_QUALITY = IMAGE_QUALITY.editorial;
const HOVER_DELAY_MS = 120;
const INTRO_MS = 980;
const REDUCE_MQ = "(prefers-reduced-motion: reduce)";
const FINE_HOVER_MQ = "(hover: hover) and (pointer: fine)";
const PANEL_SIZES =
  "(max-width: 767px) 72vw, (max-width: 1199px) 58vw, min(62vw, 56rem)";

type Copy = ReturnType<typeof useDictionary>["inProgress"];
type Phase = "boot" | "armed" | "live" | "ready";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fineHover() {
  return window.matchMedia(FINE_HOVER_MQ).matches;
}

function ObjectVideo({
  item,
  alt,
  active,
  priority,
}: {
  item: InProgressItem;
  alt: string;
  active: boolean;
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
        sizes={PANEL_SIZES}
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
  ready,
  priority,
  onActivate,
  onOpen,
  onHoverEnter,
  onHoverLeave,
}: {
  item: InProgressItem;
  index: number;
  t: Copy;
  active: boolean;
  ready: boolean;
  priority?: boolean;
  onActivate: () => void;
  onOpen: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}) {
  const mediaIndex = inProgressMediaIndex(item.id);
  const kind = item.video ? t.videoKind : t.photoKind;
  const n = pad2(index + 1);

  const onFocus = (event: FocusEvent<HTMLButtonElement>) => {
    if (!ready) return;
    if (!event.currentTarget.matches(":focus-visible")) return;
    onActivate();
  };

  const onPointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    if (!ready) return;
    if (event.pointerType !== "mouse") return;
    if (!fineHover()) return;
    onHoverEnter();
  };

  return (
    <button
      type="button"
      className={`in-progress-panel${active ? " is-active" : ""}`}
      style={{ "--i": index } as CSSProperties}
      aria-expanded={active}
      aria-haspopup="dialog"
      aria-label={`${t.open}. ${pad2(mediaIndex + 1)} / ${pad2(inProgressMedia.length)}. ${kind}`}
      onFocus={onFocus}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onHoverLeave}
      onClick={() => {
        if (!ready) return;
        if (active) onOpen();
        else onActivate();
      }}
    >
      <div className="in-progress-visual">
        {item.video ? (
          <ObjectVideo
            item={item}
            alt={t.mediaAlt}
            active={active && ready}
            priority={priority}
          />
        ) : (
          <MediaImage
            src={item.src}
            alt={t.mediaAlt}
            fill
            quality={STAGE_QUALITY}
            sizes={PANEL_SIZES}
            priority={priority}
            className="in-progress-image object-cover"
            style={{ objectPosition: item.objectPosition }}
          />
        )}
      </div>
      <span className="in-progress-shade" aria-hidden />
      <span className="in-progress-tick" aria-hidden>
        {n}
      </span>
      <span className="in-progress-caption" aria-hidden>
        <span>{n}</span>
        <span>{t.label}</span>
      </span>
    </button>
  );
}

export function InProgress() {
  const t = useDictionary().inProgress;
  const frames = inProgressComposition();
  const [activeIndex, setActiveIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("boot");
  const boardRef = useRef<HTMLDivElement>(null);
  const hoverTarget = useRef<number | null>(null);
  const hoverFrom = useRef(0);
  const hoverRaf = useRef(0);

  const stopHover = useCallback(() => {
    hoverTarget.current = null;
    if (hoverRaf.current) {
      window.cancelAnimationFrame(hoverRaf.current);
      hoverRaf.current = 0;
    }
  }, []);

  const tickHover = useCallback(
    (now: number) => {
      hoverRaf.current = 0;
      const next = hoverTarget.current;
      if (next == null) return;
      if (now - hoverFrom.current < HOVER_DELAY_MS) {
        hoverRaf.current = window.requestAnimationFrame(tickHover);
        return;
      }
      hoverTarget.current = null;
      setActiveIndex(next);
    },
    []
  );

  const armHover = useCallback(
    (index: number) => {
      hoverTarget.current = index;
      hoverFrom.current = performance.now();
      if (!hoverRaf.current) {
        hoverRaf.current = window.requestAnimationFrame(tickHover);
      }
    },
    [tickHover]
  );

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const reduce = window.matchMedia(REDUCE_MQ).matches;
    if (reduce) {
      board.classList.add("is-live", "is-interactive");
      setPhase("ready");
      return;
    }

    setPhase("armed");
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (entry.intersectionRatio < 0.32) return;
        io.disconnect();
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setPhase("live");
          });
        });
      },
      { threshold: [0.32, 0.45] }
    );
    io.observe(board);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "live") return;
    const reduce = window.matchMedia(REDUCE_MQ).matches;
    if (reduce) {
      setPhase("ready");
      return;
    }
    const wait = window.setTimeout(() => setPhase("ready"), INTRO_MS);
    return () => window.clearTimeout(wait);
  }, [phase]);

  useEffect(() => () => stopHover(), [stopHover]);

  const ready = phase === "live" || phase === "ready";
  const boardClass = [
    "in-progress-board",
    phase !== "boot" ? "is-armed" : "",
    ready ? "is-live" : "",
    phase === "ready" ? "is-interactive" : "",
    phase === "live" ? "is-animating" : "",
  ]
    .filter(Boolean)
    .join(" ");

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

        <div
          ref={boardRef}
          className={boardClass}
          data-active={activeIndex}
        >
          {frames.map((item, index) => (
            <MediaPanel
              key={item.id}
              item={item}
              index={index}
              t={t}
              active={activeIndex === index}
              ready={ready}
              priority={index === 0}
              onActivate={() => setActiveIndex(index)}
              onOpen={() => setOpenIndex(inProgressMediaIndex(item.id))}
              onHoverEnter={() => armHover(index)}
              onHoverLeave={() => {
                if (hoverTarget.current === index) stopHover();
              }}
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
