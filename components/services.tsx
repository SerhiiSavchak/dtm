import Image from "next/image";
import { services } from "@/data/content";

export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-paper"
    >
      <div className="container-dtm py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12">
          {/* Left: heading + material detail image */}
          <div className="lg:col-span-4">
            <span className="label text-accent">Послуги</span>
            <h2
              id="services-heading"
              className="mt-3 font-sans font-semibold tracking-[-0.02em] text-ink text-balance"
              style={{ fontSize: "var(--text-h2)", lineHeight: 1.05 }}
            >
              Напрями, з якими працюємо
            </h2>

            <div className="relative mt-10 hidden lg:block aspect-[4/5] overflow-hidden bg-stone">
              <Image
                src="/images/detail-01.png"
                alt="Деталь оздоблення: дерево, тиньк і метал в інтер’єрі DTM"
                fill
                sizes="33vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: large typographic service index */}
          <div className="lg:col-span-8 lg:pt-1">
            <ul className="border-t border-border">
              {services.map((service) => (
                <li key={service.index}>
                  <a
                    href="#estimate"
                    className="group grid grid-cols-[auto_1fr] md:grid-cols-[3rem_1fr_auto] items-baseline gap-x-4 md:gap-x-8 gap-y-2 border-b border-border py-7 md:py-9"
                  >
                    <span className="font-mono text-xs text-graphite tabular-nums pt-1">
                      {service.index}
                    </span>
                    <span className="col-start-2">
                      <span className="block font-sans font-medium tracking-[-0.01em] text-ink transition-colors duration-300 group-hover:text-accent text-2xl md:text-4xl">
                        {service.title}
                      </span>
                      <span className="mt-2 block max-w-md text-sm md:text-base leading-relaxed text-ink/70">
                        {service.description}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="hidden md:block md:col-start-3 self-center text-ink transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
