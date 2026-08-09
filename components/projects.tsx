import Image from "next/image";
import { projects, type Project } from "@/data/content";
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
  return (
    <article className="group">
      <a href="#projects" className="block">
        <Reveal variant="clip" className="relative overflow-hidden bg-stone">
          <div className={`relative w-full ${aspect}`}>
            <Image
              src={project.image}
              alt={`Проєкт DTM: ${project.category}, ${project.location}, ${project.area}`}
              fill
              sizes={sizes}
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
            />
          </div>
          {/* Elegant hover indicator */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-4 flex h-11 w-11 translate-y-1 items-center justify-center bg-paper text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
          >
            →
          </span>
        </Reveal>

        <Reveal
          as="div"
          delay={0.08}
          className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-3"
        >
          <div>
            <p
              className={`font-medium text-ink transition-colors duration-300 group-hover:text-accent ${
                lead ? "text-lg md:text-2xl" : "text-base md:text-lg"
              }`}
            >
              {project.title}
            </p>
            <p className="label mt-1.5 text-graphite">
              {project.category} · {project.location}
            </p>
          </div>
          <span className="font-mono text-sm tabular-nums text-graphite">
            {project.area}
          </span>
        </Reveal>
      </a>
    </article>
  );
}

export function Projects() {
  const [p1, p2, p3, p4] = projects;

  return (
    <section id="projects" aria-labelledby="projects-heading" className="bg-bg">
      <div className="container-dtm py-20 md:py-32">
        {/* Section head */}
        <div className="flex flex-col gap-6 border-t border-border pt-4 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <span className="label text-accent">(02) — Портфоліо</span>
            <h2
              id="projects-heading"
              className="mt-4 font-sans font-semibold tracking-[-0.02em] text-ink"
              style={{ fontSize: "var(--text-h1)", lineHeight: 0.98 }}
            >
              Вибрані роботи
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <a
              href="#projects"
              className="group inline-flex items-center gap-2 self-start text-sm font-medium text-ink md:self-auto"
            >
              Усі проєкти
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </a>
          </Reveal>
        </div>

        {/* Editorial asymmetric layout — one dominant lead image */}
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 md:mt-16 md:gap-y-24 lg:grid-cols-12">
          {/* Dominant lead */}
          <div className="lg:col-span-9">
            <ProjectCard
              project={p1}
              aspect="aspect-[16/10]"
              sizes="(max-width: 1024px) 100vw, 75vw"
              lead
            />
          </div>

          {/* Tall, offset lower for rhythm */}
          <div className="lg:col-span-3 lg:mt-28">
            <ProjectCard
              project={p2}
              aspect="aspect-[3/4]"
              sizes="(max-width: 1024px) 100vw, 25vw"
            />
          </div>

          {/* Small detail, offset */}
          <div className="lg:col-span-4 lg:mt-8">
            <ProjectCard
              project={p3}
              aspect="aspect-[4/5]"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          </div>

          {/* Wide moment */}
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
