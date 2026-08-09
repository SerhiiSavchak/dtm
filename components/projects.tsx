"use client";

import Image from "next/image";
import { projects, type Project } from "@/data/projects";
import { useDictionary } from "@/lib/i18n/locale-context";
import { Reveal } from "./reveal";

function ProjectCard({
  project,
  aspect,
  sizes,
  lead = false,
}: {
  project: Project;
  aspect: string;
  sizes: string;
  lead?: boolean;
}) {
  const t = useDictionary().projects;
  const title = t.titlePlaceholder;
  const category = t.categories[project.category];
  const location = t.location[project.locationKey];
  const area =
    project.area.startsWith("[") ? t.areaPlaceholder : project.area;

  return (
    <article className="group">
      <a href={`#projects`} className="block" aria-label={`${title}, ${category}`}>
        <Reveal variant="clip" className="relative overflow-hidden bg-stone">
          <div className={`relative w-full ${aspect}`}>
            <Image
              src={project.cover}
              alt={`DTM: ${category}, ${location}`}
              fill
              sizes={sizes}
              className="fx-media-scale-hover object-cover transition-transform duration-[900ms] ease-out will-change-transform"
            />
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-4 flex h-11 w-11 translate-y-1 items-center justify-center bg-paper text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            →
          </span>
        </Reveal>

        <Reveal
          as="div"
          delay={0.06}
          className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-3"
        >
          <div>
            <p
              className={`font-medium text-foreground transition-colors duration-300 group-hover:text-accent ${
                lead ? "text-lg md:text-2xl" : "text-base md:text-lg"
              }`}
            >
              {title}
            </p>
            <p className="label mt-1.5 text-muted">
              {category} · {location}
            </p>
          </div>
          <span className="font-mono text-sm tabular-nums text-muted transition-colors duration-300 group-hover:text-foreground">
            {area}
          </span>
        </Reveal>
      </a>
    </article>
  );
}

export function Projects() {
  const t = useDictionary().projects;
  const [p1, p2, p3, p4] = projects;

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="bg-bg"
    >
      <div className="container-dtm section-pad">
        <div className="flex flex-col gap-5 border-t border-border pt-4 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <span className="label text-accent">{t.label}</span>
            <h2 id="projects-heading" className="mt-4 type-h1 text-foreground">
              {t.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 self-start text-sm font-medium text-foreground md:self-auto"
            >
              {t.all}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </a>
          </Reveal>
        </div>

        {/* Asymmetric editorial grid — lead + supporting weights */}
        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-14 md:gap-y-20 lg:grid-cols-12">
          <div className="lg:col-span-8 xl:col-span-9">
            <ProjectCard
              project={p1}
              aspect="aspect-[16/10]"
              sizes="(max-width: 1024px) 100vw, 72vw"
              lead
            />
          </div>

          <div className="lg:col-span-4 lg:mt-24 xl:col-span-3 xl:mt-28">
            <ProjectCard
              project={p2}
              aspect="aspect-[3/4]"
              sizes="(max-width: 1024px) 100vw, 28vw"
            />
          </div>

          <div className="lg:col-span-4 lg:mt-6">
            <ProjectCard
              project={p3}
              aspect="aspect-[4/5]"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          </div>

          <div className="lg:col-span-8">
            <ProjectCard
              project={p4}
              aspect="aspect-[16/9]"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
