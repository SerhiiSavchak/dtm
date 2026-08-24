"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type Project } from "@/data/projects";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/image-slots";
import { useProjectTrack } from "@/lib/project-track";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";
import { editorialCardSpan } from "@/lib/portfolio-layout";
import { recordToProject } from "@/lib/sanity/map-project";
import type { PortfolioRecord } from "@/lib/sanity/types";
import { MediaImage } from "./media-image";
import { ProjectDossier } from "./project-dossier";
import { Reveal, RevealGroup } from "./reveal";
import { SectionHead } from "./section-head";
import { HoverMediaLabel } from "./fx/hover-media-label";
import { MediaParallax } from "./fx/media-parallax";
import { MediaReveal } from "./fx/media-reveal";

function slideAspect(span: Project["span"], lead: boolean) {
  // Covers are 9:16 Telegram stills (720–1052px). 16:10/16:11 slots
  // crop to ~450px of height then stretch width past the source.
  if (lead || span === "large" || span === "tall") {
    return "aspect-[4/5]";
  }
  if (span === "small") return "aspect-[4/5] md:aspect-[5/6]";
  return "aspect-[4/5]";
}

function slideSizes(lead: boolean, span: Project["span"]) {
  return lead || span === "large"
    ? IMAGE_SIZES.portfolioLead
    : IMAGE_SIZES.portfolioCard;
}

function slideQuality(lead: boolean) {
  return lead ? IMAGE_QUALITY.feature : IMAGE_QUALITY.editorial;
}

function useProjectLabels(project: Project) {
  const t = useDictionary().projects;
  return {
    title: project.title,
    category: t.categories[project.category],
    location: project.locationKey ? t.location[project.locationKey] : null,
    area: project.area
      ? project.area.startsWith("[")
        ? t.areaPlaceholder
        : project.area
      : null,
  };
}

export function Projects({ records }: { records: PortfolioRecord[] }) {
  const t = useDictionary().projects;
  const { locale } = useLocale();
  const projects = useMemo(
    () => records.map((record) => recordToProject(record, locale)),
    [records, locale]
  );
  const projectIds = useMemo(
    () => projects.map((project) => project.slug),
    [projects]
  );
  const sectionRef = useRef<HTMLElement>(null);
  const { viewportRef, activeProjectIndex, selectedSnapIndex, moveBy, canPrev, canNext, onSlideClick } =
    useProjectTrack(projectIds);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const hintDismissed = useRef(false);

  const dismissHint = useCallback(() => {
    if (hintDismissed.current) return;
    hintDismissed.current = true;
    setHintVisible(false);
  }, []);

  const step = useCallback(
    (delta: number) => {
      dismissHint();
      moveBy(delta);
    },
    [dismissHint, moveBy]
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || hintDismissed.current) return;
    let fadeTimer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || hintDismissed.current) return;
        setHintVisible(true);
        io.disconnect();
        fadeTimer = window.setTimeout(() => {
          if (!hintDismissed.current) setHintVisible(false);
        }, 4200);
      },
      { threshold: 0.35 }
    );
    io.observe(section);
    return () => {
      io.disconnect();
      window.clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="projects"
      aria-labelledby="projects-heading"
      className="bg-bg"
    >
      <div className="container-dtm section-pad">
        <RevealGroup>
          <SectionHead label={t.label} />

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <Reveal variant="rise">
              <h2 id="projects-heading" className="type-h2 text-foreground">
                {t.heading}
              </h2>
            </Reveal>

            <Reveal delay={0.06} variant="fade">
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="flex items-center gap-4">
                <span
                  className="font-mono type-small tabular-nums tracking-wide text-muted"
                  aria-live="polite"
                >
                  {String(activeProjectIndex + 1).padStart(2, "0")} {t.counter}{" "}
                  {String(projects.length).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    aria-label={t.prev}
                    onClick={() => step(-1)}
                    disabled={!canPrev}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    aria-label={t.next}
                    onClick={() => step(1)}
                    disabled={!canNext}
                  >
                    →
                  </button>
                </div>
              </div>
              <span
                className={`project-swipe-hint ${hintVisible ? "is-visible" : ""}`}
                aria-hidden
              >
                {t.swipeHint}
              </span>
            </div>
            </Reveal>
          </div>
        </RevealGroup>

        <div
          ref={viewportRef}
          className="project-viewport mt-5 md:mt-8"
          data-snap-index={selectedSnapIndex}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={t.heading}
          onPointerDown={dismissHint}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              step(1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              step(-1);
            }
          }}
        >
          <div className="project-track">
            {projects.map((project, i) => (
              <ProjectSlide
                key={project.slug}
                project={project}
                lead={i === 0}
                layoutSpan={editorialCardSpan(i)}
                active={i === activeProjectIndex}
                onOpen={() => onSlideClick(() => setOpenSlug(project.slug))}
              />
            ))}
          </div>
        </div>
      </div>

      {openSlug ? (
        <ProjectDossier
          slug={openSlug}
          projects={projects}
          onClose={() => setOpenSlug(null)}
          onNavigate={(next) => setOpenSlug(next)}
        />
      ) : null}
    </section>
  );
}

function ProjectSlide({
  project,
  lead,
  layoutSpan,
  active,
  onOpen,
}: {
  project: Project;
  lead: boolean;
  layoutSpan: Project["span"];
  active: boolean;
  onOpen: () => void;
}) {
  const t = useDictionary().projects;
  const labels = useProjectLabels(project);

  return (
    <article
      data-slide
      data-project={project.slug}
      data-span={layoutSpan}
      aria-current={active ? "true" : undefined}
      className={`project-slide group/card ${lead ? "is-lead" : ""}`}
    >
      <button
        type="button"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onClick={onOpen}
        className="block w-full text-left"
        aria-label={`${t.open}: ${labels.title}`}
      >
        <div className="project-media">
          <div className="project-media-crop">
            <div
              className={`project-media-frame relative w-full ${slideAspect(layoutSpan, lead)}`}
            >
              {lead ? (
                <MediaReveal variant="primary" className="absolute inset-0">
                  <div className="project-media-zoom">
                    <MediaParallax amount={12} className="absolute inset-0">
                      <MediaImage
                        src={project.cover}
                        alt={`DTM: ${labels.category}`}
                        lqip={project.coverLqip}
                        fill
                        quality={slideQuality(lead)}
                        sizes={slideSizes(lead, layoutSpan)}
                        className="object-cover"
                        style={{ objectPosition: project.coverPosition }}
                      />
                    </MediaParallax>
                  </div>
                </MediaReveal>
              ) : (
                <div className="project-media-zoom">
                  <MediaImage
                    src={project.cover}
                    alt={`DTM: ${labels.category}`}
                    lqip={project.coverLqip}
                    fill
                    quality={slideQuality(lead)}
                    sizes={slideSizes(lead, layoutSpan)}
                    className="object-cover"
                    style={{ objectPosition: project.coverPosition }}
                  />
                </div>
              )}
            </div>
          </div>
          <HoverMediaLabel label={t.look} />
          <span aria-hidden className="project-arrow project-arrow-hover">
            →
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <div className="min-w-0">
            <p className="type-title flex items-baseline gap-3 text-foreground transition-colors duration-300 group-hover/card:text-accent">
              <span>{labels.title}</span>
              <span className="project-arrow project-arrow-caption" aria-hidden>
                →
              </span>
            </p>
            <p className="label mt-1.5 text-muted">
              {labels.category}
              {labels.location ? ` · ${labels.location}` : ""}
            </p>
          </div>
          {labels.area ? (
            <span className="font-mono type-small tracking-wide text-muted">{labels.area}</span>
          ) : null}
        </div>
      </button>
    </article>
  );
}
