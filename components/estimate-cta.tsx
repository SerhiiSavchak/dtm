export function EstimateCta() {
  return (
    <section
      id="estimate"
      aria-labelledby="estimate-heading"
      className="bg-accent text-paper"
    >
      <div className="container-dtm py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10 items-end">
          <div className="lg:col-span-8">
            <span className="label text-paper/80">Попередній розрахунок</span>
            <h2
              id="estimate-heading"
              className="mt-4 font-sans font-semibold tracking-[-0.03em] text-paper text-balance"
              style={{ fontSize: "var(--text-h1)", lineHeight: 0.98 }}
            >
              Розкажіть про проєкт — підготуємо попередній розрахунок.
            </h2>
            <p className="mt-6 max-w-lg text-base md:text-lg leading-relaxed text-paper/85">
              Ми зберемо параметри вашого простору й повернемося з орієнтовною
              вартістю та наступними кроками. Без зобов’язань.
            </p>
          </div>

          <div className="lg:col-span-4 lg:justify-self-end">
            <a
              href="#estimate"
              className="inline-flex items-center justify-center bg-ink text-paper text-sm font-medium px-8 py-4 hover:bg-paper hover:text-ink transition-colors duration-300"
            >
              Отримати попередній розрахунок
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
