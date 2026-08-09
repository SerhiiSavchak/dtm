import Image from "next/image";

/**
 * Drop a real DTM loop here later (e.g. "/videos/hero.mp4") and the layout
 * stays identical — the poster/Image fallback keeps the composition stable
 * with no redesign. Kept null so we never depend on a fragile remote URL.
 */
const heroVideoSrc: string | null = null;
const heroPoster = "/images/hero.png";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative w-full overflow-hidden bg-ink-deep text-paper"
      style={{ minHeight: "100svh" }}
    >
      {/* ---- Full-bleed media ---- */}
      <div className="absolute inset-0">
        <div className="clip-reveal absolute inset-0">
          {heroVideoSrc ? (
            <video
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroPoster}
              aria-hidden="true"
            >
              <source src={heroVideoSrc} type="video/mp4" />
            </video>
          ) : (
            <Image
              src={heroPoster}
              alt="Інтер’єр після комплексного ремонту DTM у Львові"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
        </div>
        {/* Cinematic scrim — legibility without hiding the architecture */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,13,15,0.62) 0%, rgba(13,13,15,0.14) 32%, rgba(13,13,15,0.22) 60%, rgba(13,13,15,0.82) 100%)",
          }}
        />
      </div>

      {/* ---- Composition ---- */}
      <div className="relative flex min-h-[100svh] flex-col">
        {/* Top meta row, offset below the fixed header */}
        <div
          className="container-dtm reveal-fade delay-2 flex items-center justify-between text-paper/70"
          style={{ paddingTop: "calc(var(--header-h) + clamp(1rem, 3vh, 2rem))" }}
        >
          <span className="label">Комплексний ремонт · Львів</span>
          <span className="label hidden sm:block">DTM / 01</span>
        </div>

        {/* Bottom-anchored headline block */}
        <div className="container-dtm mt-auto pb-10 md:pb-14">
          <div>
            <h1
              id="hero-heading"
              className="font-sans font-semibold tracking-[-0.03em] text-balance"
              style={{
                fontSize: "clamp(2.5rem, 5.6vw, 5.75rem)",
                lineHeight: 0.98,
              }}
            >
              <span className="mask-line">
                <span className="delay-2">Ремонт,</span>
              </span>
              <span className="mask-line">
                <span className="delay-3">у якому все</span>
              </span>
              <span className="mask-line">
                <span className="delay-4 text-accent">під контролем.</span>
              </span>
            </h1>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12 lg:items-end">
            <p className="reveal delay-5 max-w-md text-base leading-relaxed text-paper/80 md:text-lg lg:col-span-6">
              Комплексний ремонт квартир, будинків і комерційних просторів
              у Львові — від планування до готового простору.
            </p>

            <div className="reveal delay-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:col-span-6 lg:justify-end">
              <a
                href="#estimate"
                className="inline-flex items-center justify-center bg-accent px-7 py-4 text-sm font-medium text-paper transition-colors duration-300 hover:bg-paper hover:text-ink"
              >
                Отримати попередній розрахунок
              </a>
              <a
                href="#projects"
                className="group inline-flex items-center justify-center gap-2 border border-paper/35 px-7 py-4 text-sm font-medium text-paper transition-colors duration-300 hover:border-paper hover:bg-paper/10"
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
        </div>
      </div>
    </section>
  );
}
