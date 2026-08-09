import { Reveal } from "./reveal";

export function EstimateCta() {
  return (
    <section
      id="estimate"
      aria-labelledby="estimate-heading"
      className="bg-bg text-ink"
    >
      <div className="container-dtm pb-20 pt-20 md:pb-32 md:pt-28">
        <Reveal
          as="div"
          className="flex items-center justify-between border-t border-border pt-4"
        >
          <span className="label text-accent">(04) — Кошторис</span>
          <span className="label hidden text-graphite sm:block">
            Без зобов’язань
          </span>
        </Reveal>

        {/* High-contrast dark panel */}
        <Reveal variant="clip" className="mt-10 md:mt-14">
          <div className="relative overflow-hidden bg-ink-deep text-paper">
            {/* Orange edge accent — recurring device */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-1 w-24 bg-accent"
            />

            <div className="grid grid-cols-1 gap-x-8 gap-y-10 p-8 md:p-14 lg:grid-cols-12 lg:items-end lg:p-20">
              <div className="lg:col-span-8">
                <h2
                  id="estimate-heading"
                  className="font-sans font-semibold tracking-[-0.03em] text-balance text-paper"
                  style={{ fontSize: "var(--text-h1)", lineHeight: 0.98 }}
                >
                  Розкажіть про проєкт — підготуємо{" "}
                  <span className="text-accent">попередній розрахунок.</span>
                </h2>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-paper/75 md:text-lg">
                  Ми зберемо параметри вашого простору й повернемося з
                  орієнтовною вартістю та наступними кроками.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:items-end">
                <a
                  href="#estimate"
                  className="inline-flex items-center justify-center gap-2 bg-accent px-8 py-4 text-sm font-medium text-paper transition-colors duration-300 hover:bg-paper hover:text-ink"
                >
                  Отримати попередній розрахунок
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
                <a
                  href="#contacts"
                  className="label text-paper/60 transition-colors hover:text-paper"
                >
                  або звʼязатися напряму
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
