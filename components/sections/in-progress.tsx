"use client";

import { useState } from "react";
import { inProgressMedia, socialLinks } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { MediaImage } from "../media-image";
import { PosterVideo } from "../poster-video";
import { Reveal } from "../reveal";
import { SectionHead } from "../section-head";

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
              <p className="type-body-lg text-foreground/70">{t.body}</p>
            </Reveal>
            <Reveal variant="fade" delay={0.14}>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-text group mt-5 text-foreground"
              >
                {t.instagramCta}
                <span className="btn-arrow" aria-hidden>
                  →
                </span>
              </a>
            </Reveal>
          </div>
        </div>

        <div className="in-progress-grid">
          {inProgressMedia.map((item, i) => {
            const sizes =
              item.layout === "feature"
                ? "(max-width: 1024px) 100vw, min(1120px, 88vw)"
                : "(max-width: 1023px) 100vw, min(548px, 44vw)";

            return (
              <div
                key={item.id}
                className={`in-progress-item is-${item.layout}${
                  item.mobilePriority ? "" : " is-deferred"
                }${expanded ? " is-shown" : ""}`}
              >
                <Reveal
                  variant={item.layout === "feature" ? "clip" : i % 2 === 0 ? "fade" : "clip"}
                  delay={item.layout === "feature" ? 0.04 : 0.06 + (i - 1) * 0.06}
                  className="in-progress-frame"
                >
                  {item.video ? (
                    <PosterVideo
                      poster={item.src}
                      alt={t.mediaAlt}
                      mp4={item.video}
                      sizes={sizes}
                      preload="metadata"
                      quality={75}
                      objectPosition={item.objectPosition}
                      className="absolute inset-0"
                      imageClassName="object-cover"
                      videoClassName="object-cover"
                    />
                  ) : (
                    <MediaImage
                      src={item.src}
                      alt={t.mediaAlt}
                      fill
                      quality={75}
                      sizes={sizes}
                      className="in-progress-image object-cover"
                      style={{ objectPosition: item.objectPosition }}
                    />
                  )}
                </Reveal>
              </div>
            );
          })}
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
