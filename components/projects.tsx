import Image from "next/image";
import { projects } from "@/data/content";

function ProjectMeta({
  category,
  location,
  area,
  title,
  tone = "ink",
}: {
  category: string;
  location: string;
  area: string;
  title: string;
  tone?: "ink" | "paper";
}) {
  const sub = tone === "paper" ? "text-paper/70" : "text-graphite";
  const main = tone === "paper" ? "text-paper" : "text-ink";
  return (
    <div className="mt-4 flex items-baseline justify-between gap-4">
      <div>
        <p className={`text-base md:text-lg font-medium ${main}`}>{title}</p>
        <p className={`label mt-1.5 ${sub}`}>
          {category} · {location}
        </p>
      </div>
      <span className={`font-mono text-sm tabular-nums ${sub}`}>{area}</span>
    </div>
  );
}

export function Projects() {
  const [p1, p2, p3, p4] = projects;

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="bg-bone"
    >
      <div className="container-dtm py-20 md:py-32">
        {/* Section head */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-border pb-8">
          <div>
            <span className="label text-accent">Портфоліо</span>
            <h2
              id="projects-heading"
              className="mt-3 font-sans font-semibold tracking-[-0.02em] text-ink"
              style={{ fontSize: "var(--text-h1)", lineHeight: 1 }}
            >
              Вибрані роботи
            </h2>
          </div>
          <a
            href="#projects"
            className="group inline-flex items-center gap-2 text-sm font-medium text-ink self-start md:self-auto"
          >
            Усі проєкти
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        </div>

        {/* Editorial asymmetric layout */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-14 md:gap-y-20">
          {/* Large lead project */}
          <article className="lg:col-span-8 group">
            <a href="#projects" className="block">
              <div className="relative aspect-[16/10] overflow-hidden bg-stone">
                <Image
                  src={p1.image}
                  alt={`Проєкт DTM: ${p1.category}, ${p1.location}, ${p1.area}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <ProjectMeta {...p1} />
            </a>
          </article>

          {/* Tall project, offset lower for rhythm */}
          <article className="lg:col-span-4 lg:mt-24 group">
            <a href="#projects" className="block">
              <div className="relative aspect-[3/4] overflow-hidden bg-stone">
                <Image
                  src={p2.image}
                  alt={`Проєкт DTM: ${p2.category}, ${p2.location}, ${p2.area}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <ProjectMeta {...p2} />
            </a>
          </article>

          {/* Small detail project */}
          <article className="lg:col-span-4 group">
            <a href="#projects" className="block">
              <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                <Image
                  src={p3.image}
                  alt={`Проєкт DTM: ${p3.category}, ${p3.location}, ${p3.area}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <ProjectMeta {...p3} />
            </a>
          </article>

          {/* Wide full-bleed moment */}
          <article className="lg:col-span-8 group">
            <a href="#projects" className="block">
              <div className="relative aspect-[16/9] overflow-hidden bg-stone">
                <Image
                  src={p4.image}
                  alt={`Проєкт DTM: ${p4.category}, ${p4.location}, ${p4.area}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <ProjectMeta {...p4} />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
