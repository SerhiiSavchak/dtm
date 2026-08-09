import { responsibilities } from "@/data/content";

export function Intro() {
  return (
    <section
      id="about"
      aria-labelledby="intro-heading"
      className="bg-ink text-paper"
    >
      <div className="container-dtm py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12">
          <div className="lg:col-span-3">
            <span className="label text-accent">Що ми беремо на себе</span>
          </div>

          <div className="lg:col-span-9">
            <h2
              id="intro-heading"
              className="font-sans font-medium tracking-[-0.02em] text-balance text-paper"
              style={{ fontSize: "var(--text-h2)", lineHeight: 1.08 }}
            >
              Беремо на себе весь процес ремонту — від планування
              до готового простору, у якому можна жити.
            </h2>

            <ul className="mt-14 grid grid-cols-1 sm:grid-cols-2 border-t border-white/15">
              {responsibilities.map((item, i) => (
                <li
                  key={item}
                  className="flex items-baseline gap-5 border-b border-white/15 py-6"
                >
                  <span className="font-mono text-xs text-accent tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg md:text-xl font-medium text-paper/90">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
