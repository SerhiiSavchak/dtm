"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { projects, type Project } from "@/data/projects";
import { useDictionary } from "@/lib/i18n/locale-context";
import { Reveal } from "./reveal";
import { SectionHead } from "./section-head";

function useProjectLabels(project: Project) {
  const t = useDictionary().projects;
  return {
    title: t.titlePlaceholder,
    category: t.categories[project.category],
    location: project.locationKey ? t.location[project.locationKey] : null,
    area: project.area
      ? project.area.startsWith("[")
        ? t.areaPlaceholder
        : project.area
      : null,
  };
}

export function Projects() {
  const t = useDictionary().projects;
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.querySelectorAll<HTMLElement>("[data-slide]");
    const target = slides[i];
    if (!target) return;
    track.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
    setIndex(i);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const slides = [...track.querySelectorAll<HTMLElement>("[data-slide]")];
      if (!slides.length) return;
      const left = track.scrollLeft;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((slide, i) => {
        const dist = Math.abs(slide.offsetLeft - left);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setIndex(best);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="bg-bg"
    >
      <div className="container-dtm section-pad">
        <SectionHead label={t.label} />

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <h2 id="projects-heading" className="type-h2 text-foreground">
              {t.heading}
            </h2>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm tabular-nums text-muted">
                {String(index + 1).padStart(2, "0")} {t.counter}{" "}
                {String(projects.length).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  aria-label={t.prev}
                  onClick={() => scrollTo(Math.max(0, index - 1))}
                  disabled={index === 0}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  aria-label={t.next}
                  onClick={() =>
                    scrollTo(Math.min(projects.length - 1, index + 1))
                  }
                  disabled={index === projects.length - 1}
                >
                  →
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        <div
          ref={trackRef}
          className="project-track mt-7 md:mt-8"
          tabIndex={0}
          aria-label={t.heading}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              scrollTo(Math.min(projects.length - 1, index + 1));
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              scrollTo(Math.max(0, index - 1));
            }
          }}
        >
          {projects.map((project, i) => (
            <ProjectSlide
              key={project.slug}
              project={project}
              lead={i === 0}
              onOpen={() => setOpenSlug(project.slug)}
            />
          ))}
        </div>
      </div>

      {openSlug ? (
        <ProjectModal
          key={openSlug}
          slug={openSlug}
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
  onOpen,
}: {
  project: Project;
  lead: boolean;
  onOpen: () => void;
}) {
  const t = useDictionary().projects;
  const labels = useProjectLabels(project);

  return (
    <article
      data-slide
      className={`project-slide group ${lead ? "is-lead" : ""}`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
        aria-label={`${t.open}: ${labels.title}`}
      >
        <Reveal variant="clip" className="relative overflow-hidden bg-stone">
          <div
            className={`relative w-full ${
              lead ? "aspect-[16/10]" : "aspect-[4/5] md:aspect-[16/11]"
            }`}
          >
            <Image
              src={project.cover}
              alt={`DTM: ${labels.category}${labels.location ? `, ${labels.location}` : ""}`}
              fill
              quality={90}
              sizes="(max-width: 1024px) 86vw, 70vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
            />
          </div>
          <span
            aria-hidden
            className="absolute right-4 top-4 flex h-11 w-11 translate-y-1 items-center justify-center bg-paper text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
          >
            →
          </span>
        </Reveal>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <div>
            <p className="text-lg font-medium text-foreground transition-colors duration-300 group-hover:text-accent md:text-xl">
              {labels.title}
            </p>
            <p className="label mt-1.5 text-muted">
              {labels.category}
              {labels.location ? ` · ${labels.location}` : ""}
            </p>
          </div>
          {labels.area ? (
            <span className="font-mono text-sm text-muted">{labels.area}</span>
          ) : null}
        </div>
      </button>
    </article>
  );
}

function ProjectModal({
  slug,
  onClose,
  onNavigate,
}: {
  slug: string;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}) {
  const t = useDictionary().projects;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const projectIndex = projects.findIndex((p) => p.slug === slug);
  const project = projects[projectIndex] ?? projects[0];
  const labels = useProjectLabels(project);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const titleId = useId();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        if (galleryIndex < project.gallery.length - 1) {
          setGalleryIndex((g) => g + 1);
        } else if (projectIndex < projects.length - 1) {
          onNavigate(projects[projectIndex + 1].slug);
        }
      }
      if (e.key === "ArrowLeft") {
        if (galleryIndex > 0) setGalleryIndex((g) => g - 1);
        else if (projectIndex > 0) onNavigate(projects[projectIndex - 1].slug);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryIndex, onClose, onNavigate, project.gallery.length, projectIndex]);

  const touchX = useRef<number | null>(null);

  return (
    <div
      className="project-modal-backdrop fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="calc-step-enter relative grid max-h-[92svh] w-full max-w-5xl grid-cols-1 overflow-hidden bg-ink-deep text-paper lg:grid-cols-12"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
          if (dx < -48 && galleryIndex < project.gallery.length - 1) {
            setGalleryIndex((g) => g + 1);
          }
          if (dx > 48 && galleryIndex > 0) setGalleryIndex((g) => g - 1);
          touchX.current = null;
        }}
      >
        <div className="relative aspect-[4/5] bg-ink-soft lg:col-span-7 lg:aspect-auto lg:min-h-[32rem]">
          <Image
            src={project.gallery[galleryIndex] ?? project.cover}
            alt=""
            fill
            quality={90}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col justify-between p-6 md:p-8 lg:col-span-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <span className="label text-accent">
                {String(projectIndex + 1).padStart(2, "0")}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="label text-paper/60 hover:text-paper"
                aria-label={t.close}
              >
                {t.close} ✕
              </button>
            </div>
            <h3 id={titleId} className="mt-6 type-h2 text-paper">
              {labels.title}
            </h3>
            <p className="label mt-3 text-paper/55">
              {labels.category}
              {labels.location ? ` · ${labels.location}` : ""}
              {labels.area ? ` · ${labels.area}` : ""}
            </p>

            {project.gallery.length > 1 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {project.gallery.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setGalleryIndex(i)}
                    aria-label={`${i + 1}`}
                    aria-current={galleryIndex === i}
                    className={`relative h-16 w-14 overflow-hidden border ${
                      galleryIndex === i
                        ? "border-accent"
                        : "border-white/20 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-white/15 pt-5">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={projectIndex === 0}
              onClick={() => onNavigate(projects[projectIndex - 1].slug)}
            >
              ← {t.prev}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={projectIndex === projects.length - 1}
              onClick={() => onNavigate(projects[projectIndex + 1].slug)}
            >
              {t.next} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
