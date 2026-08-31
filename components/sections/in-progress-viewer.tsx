"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type InProgressItem } from "@/data/media";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-slots";
import { useStageCrossfade } from "@/lib/media/stage-crossfade";
import { preloadSiteImage } from "@/lib/media-preload";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import { MediaImage } from "../media-image";
import { VideoPreview } from "../video-preview";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const VIEWER_SIZES = IMAGE_SIZES.inProgressViewer;

function focusable(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
  );
}

function frameKey(frame: InProgressItem) {
  return frame.video
    ? `${frame.id}::${frame.video}`
    : `${frame.id}::${frame.src ?? ""}`;
}

function ViewerFrame({
  item,
  alt,
  playLabel,
  pauseLabel,
  onReady,
  onFail,
}: {
  item: InProgressItem;
  alt: string;
  playLabel: string;
  pauseLabel: string;
  onReady?: () => void;
  onFail?: () => void;
}) {
  if (item.video) {
    return (
      <div className="in-progress-viewer-video">
        <VideoPreview
          mp4={item.video}
          alt={alt}
          poster={item.src}
          posterLqip={item.lqip}
          sizes={VIEWER_SIZES}
          quality={IMAGE_QUALITY.editorial}
          imageClassName="object-contain"
          videoClassName="object-contain"
          objectPosition={item.objectPosition}
          active
          preload="metadata"
          showToggle
          playLabel={playLabel}
          pauseLabel={pauseLabel}
          onReady={onReady}
          onFail={onFail}
        />
      </div>
    );
  }

  if (!item.src) return null;

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
      onError={() => onFail?.()}
      lqip={item.lqip}
    />
  );
}

function ViewerStage({
  item,
  alt,
  playLabel,
  pauseLabel,
  onRejected,
  onBusyChange,
}: {
  item: InProgressItem;
  alt: string;
  playLabel: string;
  pauseLabel: string;
  onRejected?: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const {
    shown,
    incoming,
    incomingOn,
    showLoader,
    pending,
    busy,
    onIncomingReady,
    onIncomingFail,
  } = useStageCrossfade(item, frameKey, false);

  const handleFail = useCallback(() => {
    onIncomingFail();
    onRejected?.();
  }, [onIncomingFail, onRejected]);

  useLayoutEffect(() => {
    onBusyChange?.(busy || pending);
  }, [busy, pending, onBusyChange]);

  return (
    <>
      <div
        className={`in-progress-viewer-stage-inner${
          pending ? " is-pending" : ""
        }`}
      >
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
              onReady={onIncomingReady}
              onFail={handleFail}
            />
          </div>
        ) : null}
        <span
          className={`media-stage-loader in-progress-viewer-wait ${showLoader ? "is-on" : ""}`}
          aria-hidden
        />
      </div>
      <span className="sr-only" aria-live="polite" aria-busy={busy || undefined} />
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
  const stableIndexRef = useRef(index);
  const [stageBusy, setStageBusy] = useState(false);
  const titleId = useId();
  const item = items[index] ?? items[0];
  const last = items.length - 1;

  const goTo = useCallback(
    (next: number) => {
      if (next !== index) stableIndexRef.current = index;
      onIndex(next);
    },
    [index, onIndex]
  );

  const revertIndex = useCallback(() => {
    onIndex(stableIndexRef.current);
  }, [onIndex]);

  useEffect(() => {
    const srcs = [item?.src, items[index - 1]?.src, items[index + 1]?.src].filter(
      Boolean
    );
    srcs.forEach((src) => {
      if (!src) return;
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
        goTo(Math.min(last, index + 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(Math.max(0, index - 1));
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
            if (dx < -48) goTo(Math.min(last, index + 1));
            if (dx > 48) goTo(Math.max(0, index - 1));
            touchX.current = null;
          }}
        >
          <ViewerStage
            item={item}
            alt={alt}
            playLabel={playLabel}
            pauseLabel={pauseLabel}
            onRejected={revertIndex}
            onBusyChange={setStageBusy}
          />

          {index > 0 ? (
            <button
              type="button"
              tabIndex={-1}
              className="in-progress-viewer-hit is-prev"
              aria-label={prevLabel}
              onClick={() => goTo(index - 1)}
            />
          ) : null}
          {index < last ? (
            <button
              type="button"
              tabIndex={-1}
              className="in-progress-viewer-hit is-next"
              aria-label={nextLabel}
              onClick={() => goTo(index + 1)}
            />
          ) : null}
        </div>

        <div className="in-progress-viewer-bar">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
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
