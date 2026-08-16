"use client";

import Image, { type ImageProps, type StaticImageData } from "next/image";
import { useCallback, useState } from "react";
import {
  getBlurDataUrl,
  resolveSiteImage,
  type SiteImageSrc,
} from "@/lib/site-images";

type MediaImageProps = Omit<ImageProps, "src" | "placeholder" | "alt"> & {
  src: SiteImageSrc;
  alt: string;
  /** Called once after the final image has loaded or failed. */
  onReady?: () => void;
};

/**
 * Progressive still: sized wrapper → image-specific LQIP → fade-in of the
 * optimized file. When `fill`, parent must be positioned (`relative` / `absolute`).
 */
export function MediaImage({
  src,
  alt,
  className = "",
  onLoad,
  onError,
  onReady,
  priority = false,
  sizes,
  fill,
  quality,
  ...rest
}: MediaImageProps) {
  const resolved = resolveSiteImage(src);
  const srcKey = typeof resolved === "string" ? resolved : resolved.src;
  const blurDataURL = getBlurDataUrl(src);
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
      if (loaded) setShown(true);
      readyOnce();
    },
    [readyOnce]
  );

  return (
    <div className="media-frame relative h-full w-full overflow-hidden">
      {blurDataURL ? (
        // eslint-disable-next-line @next/next/no-img-element -- inlined LQIP data URL
        <img
          src={blurDataURL}
          alt=""
          aria-hidden="true"
          className={`media-lqip ${className}`}
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
        className={`media-full ${shown && !failed ? "is-shown" : ""} ${
          failed ? "is-failed" : ""
        } ${className}`}
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
