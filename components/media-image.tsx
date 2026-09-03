"use client";

import Image, { type ImageProps, type StaticImageData } from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import {
  directFallbackUrl,
  loadAttemptLabel,
  MEDIA_LOAD_WATCHDOG_MS,
  nextLoadAttempt,
  type LoadAttempt,
  type LoadPhase,
} from "@/lib/media/image-load";
import {
  getBlurDataUrl,
  resolveSiteImage,
  type SiteImageSrc,
} from "@/lib/site-images";

type MediaImageProps = Omit<ImageProps, "src" | "placeholder" | "alt"> & {
  src: SiteImageSrc;
  alt: string;
  /** Sanity LQIP or other data-URL blur. Local paths still use site-images. */
  lqip?: string;
  /** Called once after the final image has loaded. */
  onReady?: () => void;
};

function revealAfterDecode(img: HTMLImageElement, done: () => void) {
  if (typeof img.decode === "function") {
    img.decode().then(done, done);
  } else {
    done();
  }
}

/**
 * Progressive still: sized wrapper → image-specific LQIP → fade-in of the
 * optimized file. When `fill`, parent must be positioned (`relative` / `absolute`).
 *
 * Load path: next/image → one retry → direct Sanity CDN (sized) → stable error.
 * LQIP is always hidden once a terminal state is reached — never infinite blur.
 */
export function MediaImage({
  src,
  alt,
  lqip,
  className = "",
  onLoad,
  onError,
  onReady,
  priority = false,
  sizes,
  fill,
  quality = 75,
  style,
  ...rest
}: MediaImageProps) {
  const resolved = resolveSiteImage(src);
  const srcKey = typeof resolved === "string" ? resolved : resolved.src;
  const blurDataURL = lqip || getBlurDataUrl(src);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const loadTokenRef = useRef(0);
  const readyOnceRef = useRef(false);
  const diagId = useId();

  const [attempt, setAttempt] = useState<LoadAttempt>("optimized");
  const [phase, setPhase] = useState<LoadPhase>("loading");
  const attemptRef = useRef<LoadAttempt>("optimized");
  const prevSrcRef = useRef(srcKey);

  useLayoutEffect(() => {
    if (prevSrcRef.current === srcKey) return;
    prevSrcRef.current = srcKey;
    loadTokenRef.current += 1;
    readyOnceRef.current = false;
    attemptRef.current = "optimized";
    setAttempt("optimized");
    setPhase("loading");
  }, [srcKey]);

  const q = typeof quality === "number" ? quality : Number(quality) || 75;

  const directUrl =
    attempt === "direct"
      ? directFallbackUrl(srcKey, sizes, q)
      : null;
  const canDirect = directFallbackUrl(srcKey, sizes, q) !== null;

  const markRevealed = useCallback(
    (token: number) => {
      if (token !== loadTokenRef.current) return;
      setPhase("revealed");
      if (!readyOnceRef.current) {
        readyOnceRef.current = true;
        onReady?.();
      }
    },
    [onReady]
  );

  const escalate = useCallback(
    (
      token: number,
      errorEvent?: SyntheticEvent<HTMLImageElement>
    ) => {
      if (token !== loadTokenRef.current) return;
      const next = nextLoadAttempt(attemptRef.current, canDirect);
      if (next === "failed") {
        setPhase("error");
        queueMicrotask(() => {
          if (token !== loadTokenRef.current) return;
          onError?.(errorEvent as never);
        });
        return;
      }
      attemptRef.current = next;
      loadTokenRef.current += 1;
      setAttempt(next);
      setPhase("loading");
    },
    [canDirect, onError]
  );

  const handleSuccess = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const token = loadTokenRef.current;
      const img = event.currentTarget;
      if (img.naturalWidth === 0) {
        escalate(token);
        return;
      }
      revealAfterDecode(img, () => markRevealed(token));
      onLoad?.(event);
    },
    [escalate, markRevealed, onLoad]
  );

  const handleError = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      if (event.currentTarget !== event.target) return;
      escalate(loadTokenRef.current, event);
    },
    [escalate]
  );

  const probeLoaded = useCallback(() => {
    const frame = frameRef.current;
    if (!frame || phase !== "loading") return;
    const img = frame.querySelector(
      "img.media-full"
    ) as HTMLImageElement | null;
    if (!img?.complete || img.naturalWidth === 0) return;
    markRevealed(loadTokenRef.current);
  }, [markRevealed, phase]);

  useEffect(() => {
    const token = loadTokenRef.current;
    probeLoaded();
    const frame = frameRef.current;
    if (!frame) return;

    const img = frame.querySelector("img.media-full") as HTMLImageElement | null;
    const onNativeError = () => {
      if (token !== loadTokenRef.current) return;
      escalate(token);
    };
    img?.addEventListener("error", onNativeError);

    const poll = window.setInterval(probeLoaded, 400);
    const watchdog = window.setTimeout(() => {
      if (token !== loadTokenRef.current || phase !== "loading") return;
      escalate(token);
    }, MEDIA_LOAD_WATCHDOG_MS);

    return () => {
      img?.removeEventListener("error", onNativeError);
      window.clearInterval(poll);
      window.clearTimeout(watchdog);
    };
  }, [srcKey, attempt, phase, escalate, probeLoaded]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const frame = frameRef.current;
    if (!frame) return;
    frame.dataset.mediaDiag = `${loadAttemptLabel(attempt)}:${phase}`;
    frame.dataset.mediaSrc = srcKey.slice(-24);
    frame.dataset.mediaProbe = diagId.slice(-8);
  }, [attempt, phase, srcKey, diagId]);

  const revealed = phase === "revealed";
  const errored = phase === "error";
  const hideLqip = revealed || errored;
  const imageKey = `${srcKey}::${attempt}`;

  return (
    <div
      ref={frameRef}
      className="media-frame relative h-full w-full overflow-hidden"
      data-load-state={phase}
      data-load-attempt={attempt}
    >
      {blurDataURL && !hideLqip ? (
        // eslint-disable-next-line @next/next/no-img-element -- inlined LQIP data URL
        <img
          src={blurDataURL}
          alt=""
          aria-hidden="true"
          className={`media-lqip ${className}`}
          style={style}
          draggable={false}
        />
      ) : null}
      {attempt === "direct" && directUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Sanity CDN fallback
        <img
          key={imageKey}
          src={directUrl}
          alt={alt}
          draggable={false}
          className={`media-full absolute inset-0 h-full w-full ${
            revealed ? "is-shown" : ""
          } ${errored ? "is-failed" : ""} ${className}`}
          style={style}
          onLoad={handleSuccess}
          onError={handleError}
        />
      ) : (
        <Image
          key={imageKey}
          src={resolved as StaticImageData | string}
          alt={alt}
          fill={fill ?? true}
          sizes={sizes}
          quality={q}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          placeholder="empty"
          draggable={false}
          className={`media-full ${revealed ? "is-shown" : ""} ${
            errored ? "is-failed" : ""
          } ${className}`}
          style={style}
          onLoad={handleSuccess}
          onError={handleError}
          {...rest}
        />
      )}
      {errored ? (
        <span className="media-load-error" aria-hidden="true" />
      ) : null}
    </div>
  );
}
