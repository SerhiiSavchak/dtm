"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { socialLinks, type InProgressItem } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { IMAGE_QUALITY } from "@/lib/image-slots";
import { CopyText } from "../copy-text";
import { InteractiveArrow } from "../fx/interactive-arrow";
import { MediaImage } from "../media-image";
import { VideoPreview } from "../video-preview";
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
  if (!item.video) return null;

  return (
    <div className="in-progress-video">
      <VideoPreview
        mp4={item.video}
        alt={alt}
        poster={item.src}
        posterLqip={item.lqip}
        sizes={PANEL_SIZES}
        quality={STAGE_QUALITY}
        priority={priority}
        imageClassName="in-progress-image object-cover"
        videoClassName="in-progress-video-el object-cover"
        objectPosition={item.objectPosition}
        active={active}
        preload="metadata"
      />
    </div>
  );
}

function MediaPanel({
  item,
  index,
  collectionLength,
  mediaIndex,
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
  collectionLength: number;
  mediaIndex: number;
  t: Copy;
  active: boolean;
  ready: boolean;
  priority?: boolean;
  onActivate: () => void;
  onOpen: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}) {
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
      aria-label={`${t.open}. ${pad2(mediaIndex + 1)} / ${pad2(collectionLength)}. ${kind}`}
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
        ) : item.src ? (
          <MediaImage
            src={item.src}
            alt={t.mediaAlt}
            fill
            quality={STAGE_QUALITY}
            sizes={PANEL_SIZES}
            priority={priority}
            className="in-progress-image object-cover"
            style={{ objectPosition: item.objectPosition }}
            lqip={item.lqip}
          />
        ) : null}
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

export function InProgress({
  frames,
  boardIds,
}: {
  frames: InProgressItem[];
  boardIds: string[];
}) {
  const t = useDictionary().inProgress;
  const composition = boardIds
    .map((id) => frames.find((item) => item.id === id))
    .filter((item): item is InProgressItem => Boolean(item));
  const framesForViewer = frames;
  const mediaIndexOf = (id: string) =>
    framesForViewer.findIndex((item) => item.id === id);
  const panels = composition.length === 4 ? composition : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("boot");
  const boardRef = useRef<HTMLDivElement>(null);
  const hoverTarget = useRef<number | null>(null);
  const hoverFrom = useRef(0);
  const hoverRaf = useRef(0);
  const tickHoverRef = useRef<(now: number) => void>(() => {});

  const reduced = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCE_MQ);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCE_MQ).matches,
    () => false
  );

  const stopHover = useCallback(() => {
    hoverTarget.current = null;
    if (hoverRaf.current) {
      window.cancelAnimationFrame(hoverRaf.current);
      hoverRaf.current = 0;
    }
  }, []);

  useLayoutEffect(() => {
    tickHoverRef.current = (now: number) => {
      hoverRaf.current = 0;
      const next = hoverTarget.current;
      if (next == null) return;
      if (now - hoverFrom.current < HOVER_DELAY_MS) {
        hoverRaf.current = window.requestAnimationFrame((t) =>
          tickHoverRef.current(t)
        );
        return;
      }
      hoverTarget.current = null;
      setActiveIndex(next);
    };
  });

  const armHover = useCallback((index: number) => {
    hoverTarget.current = index;
    hoverFrom.current = performance.now();
    if (!hoverRaf.current) {
      hoverRaf.current = window.requestAnimationFrame((t) =>
        tickHoverRef.current(t)
      );
    }
  }, []);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    if (reduced) return;

    const arm = window.requestAnimationFrame(() => {
      setPhase((current) => (current === "boot" ? "armed" : current));
    });

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
    return () => {
      window.cancelAnimationFrame(arm);
      io.disconnect();
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced || phase !== "live") return;
    const wait = window.setTimeout(() => setPhase("ready"), INTRO_MS);
    return () => window.clearTimeout(wait);
  }, [phase, reduced]);

  useEffect(() => () => stopHover(), [stopHover]);

  const ready = reduced || phase === "live" || phase === "ready";
  const boardClass = [
    "in-progress-board",
    reduced || phase !== "boot" ? "is-armed" : "",
    ready ? "is-live" : "",
    reduced || phase === "ready" ? "is-interactive" : "",
    !reduced && phase === "live" ? "is-animating" : "",
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
          {panels.map((item, index) => (
            <MediaPanel
              key={item.id}
              item={item}
              index={index}
              collectionLength={framesForViewer.length}
              mediaIndex={mediaIndexOf(item.id)}
              t={t}
              active={activeIndex === index}
              ready={ready}
              onActivate={() => setActiveIndex(index)}
              onOpen={() => setOpenIndex(mediaIndexOf(item.id))}
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
          items={framesForViewer}
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
