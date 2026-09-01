"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MediaImage } from "./media-image";
import type { SiteImageSrc } from "@/lib/site-images";

type VideoPreviewProps = {
  mp4: string;
  alt: string;
  poster?: SiteImageSrc;
  posterLqip?: string;
  sizes?: string;
  quality?: number;
  className?: string;
  imageClassName?: string;
  videoClassName?: string;
  objectPosition?: string;
  active?: boolean;
  /** When false the <source> is not mounted — no video bytes fetched. */
  loadSource?: boolean;
  loop?: boolean;
  preload?: "none" | "metadata" | "auto";
  priority?: boolean;
  onReady?: () => void;
  onFail?: () => void;
  showToggle?: boolean;
  playLabel?: string;
  pauseLabel?: string;
};

/**
 * Video preview for In-progress: optional custom poster, otherwise the first
 * decodable video frame. Muted, playsInline, no native controls unless toggled.
 */
export function VideoPreview({
  mp4,
  alt,
  poster,
  posterLqip,
  sizes,
  quality = 85,
  className = "",
  imageClassName = "object-cover",
  videoClassName = "object-cover",
  objectPosition = "center center",
  active = true,
  loadSource = true,
  loop = true,
  preload = "metadata",
  priority = false,
  onReady,
  onFail,
  showToggle = false,
  playLabel = "Play",
  pauseLabel = "Pause",
}: VideoPreviewProps) {
  return (
    <VideoPreviewInner
      key={`${mp4}::${poster ?? ""}::${loadSource}`}
      mp4={mp4}
      alt={alt}
      poster={poster}
      posterLqip={posterLqip}
      sizes={sizes}
      quality={quality}
      className={className}
      imageClassName={imageClassName}
      videoClassName={videoClassName}
      objectPosition={objectPosition}
      active={active}
      loadSource={loadSource}
      loop={loop}
      preload={preload}
      priority={priority}
      onReady={onReady}
      onFail={onFail}
      showToggle={showToggle}
      playLabel={playLabel}
      pauseLabel={pauseLabel}
    />
  );
}

function VideoPreviewInner({
  mp4,
  alt,
  poster,
  posterLqip,
  sizes,
  quality = 85,
  className = "",
  imageClassName = "object-cover",
  videoClassName = "object-cover",
  objectPosition = "center center",
  active = true,
  loadSource = true,
  loop = true,
  preload = "metadata",
  priority = false,
  onReady,
  onFail,
  showToggle = false,
  playLabel = "Play",
  pauseLabel = "Pause",
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const signaled = useRef(false);
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const positionStyle = { objectPosition } as CSSProperties;
  const hasPoster = Boolean(poster);
  const effectivePreload = loadSource ? (active ? preload : "none") : "none";

  const signalReady = useCallback(() => {
    if (signaled.current) return;
    signaled.current = true;
    onReady?.();
  }, [onReady]);

  const tryPlay = useCallback(
    (el: HTMLVideoElement) => {
      if (!active || !loadSource) {
        el.pause();
        setPlaying(false);
        return;
      }
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduce || document.hidden) {
        el.pause();
        setPlaying(false);
        return;
      }
      if (el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      el.muted = true;
      el.defaultMuted = true;
      el.play()
        .then(() => {
          setPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          setPlaying(false);
          setAutoplayBlocked(true);
          if (process.env.NODE_ENV !== "production") {
            console.debug("[VideoPreview] autoplay rejected");
          }
        });
    },
    [active, loadSource]
  );

  const onVideoFrame = useCallback(
    (el: HTMLVideoElement) => {
      if (el.videoWidth < 2 || el.videoHeight < 2) return;
      setVideoReady(true);
      signalReady();
      tryPlay(el);
    },
    [signalReady, tryPlay]
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    tryPlay(el);
    const onVis = () => {
      if (document.hidden) {
        el.pause();
        setPlaying(false);
      } else {
        tryPlay(el);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      el.pause();
    };
  }, [active, loadSource, mp4, tryPlay]);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.muted = true;
      el.play()
        .then(() => {
          setPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => setAutoplayBlocked(true));
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const showPoster =
    hasPoster && (!videoReady || autoplayBlocked);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {hasPoster ? (
        <MediaImage
          src={poster!}
          alt={alt}
          lqip={posterLqip}
          fill
          priority={priority}
          quality={quality}
          sizes={sizes}
          className={`${imageClassName} ${showPoster ? "" : "opacity-0"}`}
          style={positionStyle}
          onReady={signalReady}
        />
      ) : null}
      <video
        ref={videoRef}
        className={`media-video ${videoClassName} ${
          !hasPoster || videoReady ? "is-shown" : ""
        }`}
        style={positionStyle}
        muted
        autoPlay={active && loadSource}
        loop={loop}
        playsInline
        preload={effectivePreload}
        aria-label={alt}
        onLoadedData={(event) => onVideoFrame(event.currentTarget)}
        onCanPlay={(event) => onVideoFrame(event.currentTarget)}
        onError={() => onFail?.()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        {loadSource ? <source src={mp4} type="video/mp4" /> : null}
      </video>
      {showToggle || autoplayBlocked ? (
        <button
          type="button"
          className="in-progress-viewer-toggle"
          aria-label={playing ? pauseLabel : playLabel}
          onClick={toggle}
        >
          {playing ? pauseLabel : playLabel}
        </button>
      ) : null}
    </div>
  );
}
