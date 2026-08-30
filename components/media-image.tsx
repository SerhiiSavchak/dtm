"use client";

import Image, { type ImageProps, type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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

/**
 * Progressive still: sized wrapper → image-specific LQIP → fade-in of the
 * optimized file. When `fill`, parent must be positioned (`relative` / `absolute`).
 * Decoded file is visible without waiting for the is-shown class (CSS animation
 * completes to opacity 1); the class only cancels the fade once loaded.
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
  quality,
  style,
  ...rest
}: MediaImageProps) {
  const resolved = resolveSiteImage(src);
  const srcKey = typeof resolved === "string" ? resolved : resolved.src;
  const blurDataURL = lqip || getBlurDataUrl(src);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  const [failed, setFailed] = useState(false);
  const [seenSrc, setSeenSrc] = useState(srcKey);

  if (seenSrc !== srcKey) {
    setSeenSrc(srcKey);
    setShown(false);
    setFailed(false);
  }

  const readyOnce = useCallback(() => {
    onReady?.();
  }, [onReady]);

  const reveal = useCallback(
    (loaded: boolean) => {
      if (loaded) {
        setShown(true);
        readyOnce();
      }
    },
    [readyOnce]
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const img = frame.querySelector("img.media-full") as HTMLImageElement | null;
    if (img?.complete && img.naturalWidth > 0) {
      reveal(true);
    }
  }, [srcKey, reveal]);

  return (
    <div ref={frameRef} className="media-frame relative h-full w-full overflow-hidden">
      {blurDataURL ? (
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
      <Image
        src={resolved as StaticImageData | string}
        alt={alt}
        fill={fill ?? true}
        sizes={sizes}
        quality={quality}
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        placeholder="empty"
        draggable={false}
        className={`media-full ${shown && !failed ? "is-shown" : ""} ${
          failed ? "is-failed" : ""
        } ${className}`}
        style={style}
        onLoad={(event) => {
          reveal(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setFailed(true);
          reveal(false);
          onError?.(event);
        }}
        {...rest}
      />
    </div>
  );
}
