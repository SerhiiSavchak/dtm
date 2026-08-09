import { responsibilities } from "@/data/content";
import { Reveal } from "./reveal";

export function Intro() {
  return (
    <section
      id="about"
      aria-labelledby="intro-heading"
      className="bg-bg text-ink"
    >
      <div className="container-dtm py-20 md:py-32">
        {/* Section index — recurring DTM device */}
        <Reveal
          as="div"
          className="flex items-center justify-between border-t border-border pt-4"
        >
          <span className="label text-accent">(01) — Про DTM</span>
          <span className="label hidden text-graphite sm:block">
            Процес під ключ
          </span>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h2
                id="intro-heading"
                className="font-sans font-medium tracking-[-0.02em] text-balance text-ink"
                style={{ fontSize: "var(--text-h2)", lineHeight: 1.08 }}
              >
                Беремо на себе{" "}
                <span className="text-accent">весь процес ремонту</span> — від
                планування до готового простору, у якому можна жити.
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:pt-2">
            <Reveal delay={0.1}>
              <p className="max-w-md text-base leading-relaxed text-ink/70 md:text-lg">
                Один підрядник, одна відповідальність. Ви узгоджуєте результат,
                а організацію, закупівлю й контроль якості беремо на себе ми.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Responsibilities — numbered architectural list */}
        <ul className="mt-14 grid grid-cols-1 border-t border-border sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
          {responsibilities.map((item, i) => (
            <Reveal
              as="li"
              key={item}
              delay={i * 0.06}
              className="group flex items-baseline gap-5 border-b border-border py-6 md:py-7"
            >
              <span className="font-mono text-xs tabular-nums text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-lg font-medium text-ink md:text-xl">
                {item}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
