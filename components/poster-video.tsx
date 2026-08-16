"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { MediaImage } from "./media-image";
import type { SiteImageSrc } from "@/lib/site-images";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type PosterVideoProps = {
  poster: SiteImageSrc;
  alt: string;
  mp4?: string | null;
  webm?: string | null;
  sizes: string;
  className?: string;
  imageClassName?: string;
  videoClassName?: string;
  /** LCP still only — never the video. */
  priority?: boolean;
  quality?: number;
  /** After the sharp poster can paint. */
  onPosterReady?: () => void;
  /**
   * Hero may use `auto` once the poster is ready. Below-the-fold should stay
   * `metadata` / `none`.
   */
  preload?: "none" | "metadata" | "auto";
  objectPosition?: string;
};

/**
 * Blur → sharp poster → video. The poster never unmounts; the video crossfades
 * only after a renderable frame (`canplay`) and a successful play() attempt.
 */
export function PosterVideo({
  poster,
  alt,
  mp4,
  webm,
  sizes,
  className = "",
  imageClassName = "object-cover",
  videoClassName = "object-cover",
  priority = false,
  quality = 90,
  onPosterReady,
  preload = "metadata",
  objectPosition,
}: PosterVideoProps) {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const [posterReady, setPosterReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const signaled = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hasVideo = Boolean(webm || mp4);
  const mountVideo = hasVideo && !reduced && !videoFailed && posterReady;

  const signalPoster = useCallback(() => {
    if (signaled.current) return;
    signaled.current = true;
    setPosterReady(true);
    onPosterReady?.();
  }, [onPosterReady]);

  const tryReveal = useCallback((el: HTMLVideoElement) => {
    if (el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (el.videoWidth < 2 || el.videoHeight < 2) return;
    el.play()
      .then(() => setVideoReady(true))
      .catch(() => setVideoFailed(true));
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !mountVideo) return;
    tryReveal(el);
  }, [mountVideo, tryReveal]);

  const positionStyle = objectPosition
    ? ({ objectPosition } as CSSProperties)
    : undefined;

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <MediaImage
        src={poster}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={imageClassName}
        style={positionStyle}
        onReady={signalPoster}
      />
      {mountVideo ? (
        <video
          ref={videoRef}
          className={`media-video ${videoClassName} ${
            videoReady ? "is-shown" : ""
          }`}
          style={positionStyle}
          muted
          loop
          playsInline
          autoPlay
          preload={preload}
          aria-hidden="true"
          onCanPlay={(event) => tryReveal(event.currentTarget)}
          onLoadedData={(event) => {
            const el = event.currentTarget;
            if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              tryReveal(el);
            }
          }}
          onError={() => setVideoFailed(true)}
        >
          {webm ? <source src={webm} type="video/webm" /> : null}
          {mp4 ? <source src={mp4} type="video/mp4" /> : null}
        </video>
      ) : null}
    </div>
  );
}
