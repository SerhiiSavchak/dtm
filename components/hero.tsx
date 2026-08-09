import Image from "next/image";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative pt-24 md:pt-28"
    >
      <div className="container-dtm">
        {/* Top meta row */}
        <div className="reveal reveal-fade flex items-center justify-between border-t border-border pt-4 text-graphite">
          <span className="label">Ремонт під ключ · Львів</span>
          <span className="label hidden sm:block">Est. DTM</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 pt-8 md:pt-12 pb-14 md:pb-20 items-end">
          {/* Headline block */}
          <div className="lg:col-span-7 xl:col-span-6">
            <h1
              id="hero-heading"
              className="reveal font-sans font-semibold tracking-[-0.03em] text-ink text-balance"
              style={{ fontSize: "var(--text-display)", lineHeight: 0.95 }}
            >
              Ремонт,
              <br />
              у якому все
              <br />
              <span className="text-accent">під контролем.</span>
            </h1>

            <p className="reveal delay-2 mt-7 max-w-md text-base md:text-lg leading-relaxed text-ink/75">
              Комплексний ремонт квартир, будинків і комерційних просторів
              у Львові — від планування до готового простору.
            </p>

            <div className="reveal delay-3 mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href="#estimate"
                className="inline-flex items-center justify-center bg-accent text-paper text-sm font-medium px-7 py-4 hover:bg-ink transition-colors duration-300"
              >
                Отримати попередній розрахунок
              </a>
              <a
                href="#projects"
                className="group inline-flex items-center justify-center gap-2 text-sm font-medium text-ink px-2 py-4"
              >
                Дивитися роботи
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            </div>
          </div>

          {/* Image block */}
          <div className="lg:col-span-5 xl:col-span-6 lg:col-start-8 xl:col-start-7">
            <figure className="relative">
              <div className="clip-reveal relative aspect-[4/5] lg:aspect-[3/4] w-full overflow-hidden bg-stone">
                {/*
                  Above-the-fold hero asset. Designed so a looping project
                  video could replace this <Image> in production.
                */}
                <Image
                  src="/images/hero.png"
                  alt="Інтер’єр квартири після комплексного ремонту DTM у Львові"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="reveal delay-4 mt-3 flex items-center justify-between text-graphite">
                <span className="label">Вибраний проєкт</span>
                <span className="label">Квартира · 92 м²</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
