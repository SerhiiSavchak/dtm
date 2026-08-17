"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type InProgressItem } from "@/data/media";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-slots";
import { preloadSiteImage } from "@/lib/media-preload";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import { MediaImage } from "../media-image";
import type { SiteImageSrc } from "@/lib/site-images";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const VIEWER_SIZES = IMAGE_SIZES.inProgressViewer;
const CROSSFADE_MS = 180;
const SLOW_WAIT_MS = 150;

function focusable(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
  );
}

function ViewerVideo({
  poster,
  mp4,
  alt,
  playLabel,
  pauseLabel,
  onReady,
}: {
  poster: SiteImageSrc;
  mp4: string;
  alt: string;
  playLabel: string;
  pauseLabel: string;
  onReady?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const allowAuto =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tryPlay = () => {
      if (!allowAuto) return;
      if (el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      el.play()
        .then(() => {
          setPlaying(true);
          setReady(true);
        })
        .catch(() => setPlaying(false));
    };
    tryPlay();
    const onVis = () => {
      if (document.hidden) {
        el.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      el.pause();
    };
  }, [mp4]);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="in-progress-viewer-video">
      <MediaImage
        src={poster}
        alt={alt}
        fill
        quality={IMAGE_QUALITY.editorial}
        sizes={VIEWER_SIZES}
        className="object-contain"
        onReady={onReady}
      />
      <video
        ref={videoRef}
        className={`media-video object-contain ${ready ? "is-shown" : ""}`}
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={(event) => {
          const el = event.currentTarget;
          if (el.videoWidth < 2) return;
          if (!el.paused) setReady(true);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={mp4} type="video/mp4" />
      </video>
      <button
        type="button"
        className="in-progress-viewer-toggle"
        aria-label={playing ? pauseLabel : playLabel}
        onClick={toggle}
      >
        {playing ? pauseLabel : playLabel}
      </button>
    </div>
  );
}

function ViewerFrame({
  item,
  alt,
  playLabel,
  pauseLabel,
  onReady,
}: {
  item: InProgressItem;
  alt: string;
  playLabel: string;
  pauseLabel: string;
  onReady?: () => void;
}) {
  if (item.video) {
    return (
      <ViewerVideo
        poster={item.src}
        mp4={item.video}
        alt={alt}
        playLabel={playLabel}
        pauseLabel={pauseLabel}
        onReady={onReady}
      />
    );
  }

  return (
    <MediaImage
      src={item.src}
      alt={alt}
      fill
      quality={IMAGE_QUALITY.editorial}
      sizes={VIEWER_SIZES}
      priority
      className="object-contain"
      onReady={onReady}
    />
  );
}

function ViewerStage({
  item,
  alt,
  playLabel,
  pauseLabel,
}: {
  item: InProgressItem;
  alt: string;
  playLabel: string;
  pauseLabel: string;
}) {
  const [shown, setShown] = useState(item);
  const [incoming, setIncoming] = useState<InProgressItem | null>(null);
  const [incomingOn, setIncomingOn] = useState(false);
  const [slow, setSlow] = useState(false);

  if (shown.id !== item.id && incoming?.id !== item.id) {
    setIncoming(item);
    setIncomingOn(false);
    setSlow(false);
  } else if (shown.id === item.id && incoming) {
    setIncoming(null);
    setIncomingOn(false);
    setSlow(false);
  }

  useEffect(() => {
    if (!incoming || incomingOn) return;
    const wait = window.setTimeout(() => setSlow(true), SLOW_WAIT_MS);
    return () => window.clearTimeout(wait);
  }, [incoming, incomingOn]);

  useEffect(() => {
    if (!incomingOn || !incoming) return;
    const next = incoming;
    const fade = window.setTimeout(() => {
      setShown(next);
      setIncoming(null);
      setIncomingOn(false);
      setSlow(false);
    }, CROSSFADE_MS);
    return () => window.clearTimeout(fade);
  }, [incoming, incomingOn]);

  return (
    <>
      <div className="in-progress-viewer-layer is-shown">
        <ViewerFrame
          item={shown}
          alt={alt}
          playLabel={playLabel}
          pauseLabel={pauseLabel}
        />
      </div>
      {incoming ? (
        <div
          className={`in-progress-viewer-layer ${incomingOn ? "is-shown" : ""}`}
        >
          <ViewerFrame
            item={incoming}
            alt={alt}
            playLabel={playLabel}
            pauseLabel={pauseLabel}
            onReady={() => {
              setSlow(false);
              setIncomingOn(true);
            }}
          />
        </div>
      ) : null}
      <span className={`in-progress-viewer-wait ${slow ? "is-on" : ""}`} aria-hidden />
    </>
  );
}

type InProgressViewerProps = {
  items: InProgressItem[];
  index: number;
  alt: string;
  galleryLabel: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
  playLabel: string;
  pauseLabel: string;
  onClose: () => void;
  onIndex: (index: number) => void;
};

export function InProgressViewer({
  items,
  index,
  alt,
  galleryLabel,
  closeLabel,
  prevLabel,
  nextLabel,
  playLabel,
  pauseLabel,
  onClose,
  onIndex,
}: InProgressViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const titleId = useId();
  const item = items[index] ?? items[0];
  const last = items.length - 1;

  useEffect(() => {
    const srcs = [item?.src, items[index - 1]?.src, items[index + 1]?.src].filter(
      Boolean
    ) as SiteImageSrc[];
    srcs.forEach((src) => {
      void preloadSiteImage(src, {
        sizes: VIEWER_SIZES,
        quality: IMAGE_QUALITY.editorial,
      });
    });
  }, [index, item?.src, items]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    lockScroll();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      unlockScroll();
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === " " && item?.video) {
        const toggle = root.querySelector<HTMLButtonElement>(
          ".in-progress-viewer-toggle"
        );
        if (toggle) {
          event.preventDefault();
          toggle.click();
        }
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndex(Math.min(last, index + 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndex(Math.max(0, index - 1));
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable(root);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, item?.video, last, onClose, onIndex]);

  if (typeof document === "undefined" || !item) return null;

  return createPortal(
    <div
      className="in-progress-viewer-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="in-progress-viewer"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="sr-only">
          {galleryLabel}
        </h2>

        <button
          ref={closeRef}
          type="button"
          className="in-progress-viewer-close label"
          onClick={onClose}
          aria-label={closeLabel}
        >
          {closeLabel} ✕
        </button>

        <div
          className="in-progress-viewer-stage"
          onTouchStart={(event) => {
            touchX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchX.current == null) return;
            const dx = (event.changedTouches[0]?.clientX ?? 0) - touchX.current;
            if (dx < -48) onIndex(Math.min(last, index + 1));
            if (dx > 48) onIndex(Math.max(0, index - 1));
            touchX.current = null;
          }}
        >
          <ViewerStage
            item={item}
            alt={alt}
            playLabel={playLabel}
            pauseLabel={pauseLabel}
          />

          {index > 0 ? (
            <button
              type="button"
              tabIndex={-1}
              className="in-progress-viewer-hit is-prev"
              aria-label={prevLabel}
              onClick={() => onIndex(index - 1)}
            />
          ) : null}
          {index < last ? (
            <button
              type="button"
              tabIndex={-1}
              className="in-progress-viewer-hit is-next"
              aria-label={nextLabel}
              onClick={() => onIndex(index + 1)}
            />
          ) : null}
        </div>

        <div className="in-progress-viewer-bar">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={index === 0}
            onClick={() => onIndex(index - 1)}
          >
            ← {prevLabel}
          </button>
          <p className="in-progress-viewer-count" aria-live="polite">
            {index + 1} / {items.length}
          </p>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={index === last}
            onClick={() => onIndex(index + 1)}
          >
            {nextLabel} →
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
