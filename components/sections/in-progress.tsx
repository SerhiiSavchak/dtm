"use client";

import Image from "next/image";
import { useState } from "react";
import { inProgressMedia, socialLinks } from "@/data/media";
import { useDictionary } from "@/lib/i18n/locale-context";
import { Reveal } from "../reveal";
import { SectionHead } from "../section-head";

export function InProgress() {
  const t = useDictionary().inProgress;
  const [videoOk, setVideoOk] = useState(Boolean(inProgressMedia.leadVideo));

  return (
    <section
      id="in-progress"
      aria-labelledby="in-progress-heading"
      className="bg-bg text-foreground"
    >
      <div className="container-dtm section-pad">
        <SectionHead label={t.label} right={t.labelRight} />

        {/* Editorial spread: text column + dominant documentary frame */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 id="in-progress-heading" className="type-h2 text-foreground">
                {t.heading}
              </h2>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="type-body-lg mt-4 max-w-md text-foreground/70">
                {t.body}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="label mt-8 text-muted">{t.captionPlaceholder}</p>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-text group mt-4 text-foreground"
              >
                {t.instagramCta}
                <span className="btn-arrow" aria-hidden>
                  →
                </span>
              </a>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Reveal
              variant="clip"
              className="relative aspect-[4/5] overflow-hidden bg-stone sm:aspect-[16/10]"
            >
              {videoOk && inProgressMedia.leadVideo ? (
                <video
                  className="h-full w-full object-cover object-center"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={inProgressMedia.lead}
                  onError={() => setVideoOk(false)}
                >
                  <source src={inProgressMedia.leadVideo} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={inProgressMedia.lead}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink-deep/80 to-transparent p-4">
                <span className="label text-paper/90">{t.stages.finishing}</span>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Supporting strip: narrow vertical / wide medium / small detail on one baseline */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:mt-5 lg:grid-cols-12">
          {inProgressMedia.tiles.slice(0, 3).map((tile, i) => {
            const spans = [
              "col-span-1 aspect-[4/5] lg:col-span-3",
              "col-span-1 aspect-[4/5] lg:col-span-6",
              "col-span-2 aspect-[16/10] lg:col-span-3",
            ][i];
            return (
              <Reveal
                key={tile.src}
                variant="clip"
                delay={0.04 + i * 0.05}
                className={`group relative overflow-hidden bg-stone lg:aspect-auto lg:h-[clamp(15rem,23vw,23rem)] ${spans}`}
              >
                <Image
                  src={tile.src}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <span className="label text-paper/90">
                    {t.stages[tile.stageKey]}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
