"use client";

import { useState } from "react";
import {
  inProgressMedia,
  socialLinks,
  type InProgressItem,
} from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { CopyText } from "../copy-text";
import { MediaImage } from "../media-image";
import { PosterVideo } from "../poster-video";
import { Reveal } from "../reveal";
import { SectionHead } from "../section-head";
import { CornerFrame } from "../fx/corner-frame";
import { InteractiveArrow } from "../fx/interactive-arrow";
import { MediaParallax } from "../fx/media-parallax";
import { MediaReveal } from "../fx/media-reveal";

function shotSizes(layout: InProgressItem["layout"]) {
  return layout === "feature"
    ? "(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) calc(100vw - 5rem), min(1280px, calc(100vw - 11rem))"
    : "(max-width: 1023px) calc(100vw - 3rem), min(630px, calc((100vw - 12rem) / 2))";
}

function InProgressShot({
  item,
  alt,
}: {
  item: InProgressItem;
  alt: string;
}) {
  const sizes = shotSizes(item.layout);

  return (
    <div className="in-progress-visual">
      {item.video ? (
        <PosterVideo
          poster={item.src}
          alt={alt}
          mp4={item.video}
          sizes={sizes}
          preload="metadata"
          quality={75}
          objectPosition={item.objectPosition}
          className="absolute inset-0"
          imageClassName="in-progress-image object-cover"
          videoClassName="in-progress-image object-cover"
        />
      ) : (
        <MediaImage
          src={item.src}
          alt={alt}
          fill
          quality={75}
          sizes={sizes}
          className="in-progress-image object-cover"
          style={{ objectPosition: item.objectPosition }}
        />
      )}
    </div>
  );
}

export function InProgress() {
  const t = useDictionary().inProgress;
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = inProgressMedia.filter((item) => !item.mobilePriority).length;

  return (
    <section
      id="in-progress"
      aria-labelledby="in-progress-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <SectionHead label={t.label} right={t.labelRight} />

        <div className="in-progress-intro">
          <Reveal variant="mask">
            <h2 id="in-progress-heading" className="type-h2 text-foreground">
              {t.heading}
            </h2>
          </Reveal>
          <div className="in-progress-intro-copy">
            <Reveal variant="fade" delay={0.08}>
              <p className="type-body-lg in-progress-body">
                <CopyText>{t.body}</CopyText>
              </p>
            </Reveal>
            <Reveal variant="fade" delay={0.14}>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-text group mt-5 text-foreground"
              >
                {t.instagramCta}
                <InteractiveArrow />
              </a>
            </Reveal>
          </div>
        </div>

        <div className="in-progress-grid">
          {inProgressMedia.map((item, i) => (
            <div
              key={item.id}
              className={`in-progress-item is-${item.layout}${
                item.mobilePriority ? "" : " is-deferred"
              }${expanded ? " is-shown" : ""}`}
            >
              <MediaReveal
                variant={item.layout === "feature" ? "primary" : "secondary"}
                delay={item.layout === "feature" ? 0.04 : 0.06 + Math.max(0, i - 1) * 0.06}
                className="in-progress-frame"
              >
                {item.layout === "feature" ? (
                  <CornerFrame className="absolute inset-0 h-full">
                    <MediaParallax amount={14} className="absolute inset-0">
                      <InProgressShot item={item} alt={t.mediaAlt} />
                    </MediaParallax>
                  </CornerFrame>
                ) : (
                  <InProgressShot item={item} alt={t.mediaAlt} />
                )}
              </MediaReveal>
            </div>
          ))}
        </div>

        {hiddenCount > 0 ? (
          <div className="mt-6 lg:hidden">
            <button
              type="button"
              className="btn btn-secondary"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? t.showLess : t.showMore}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
