import { Logo } from "./logo";
import { nav } from "@/data/content";

export function SiteFooter() {
  return (
    <footer
      id="contacts"
      className="bg-ink-deep text-paper mt-auto"
      aria-label="Підвал сайту"
    >
      <div className="container-dtm py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10">
          <div className="md:col-span-5">
            <Logo tone="paper" withDescriptor />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-paper/70">
              Комплексний ремонт квартир, будинків і комерційних просторів
              у Львові.
            </p>
          </div>

          <nav
            aria-label="Навігація в підвалі"
            className="md:col-span-4 flex flex-col gap-3"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-paper/80 hover:text-accent transition-colors w-fit"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="label text-paper/50">Локація</span>
            <p className="text-sm text-paper/80">Львів, Україна</p>
          </div>
        </div>

        <div className="mt-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-white/15 pt-6">
          <span className="label text-paper/50">
            © {new Date().getFullYear()} DTM — Дім Твоєї Мрії
          </span>
          <span className="label text-paper/40">Львів · Україна</span>
        </div>
      </div>
    </footer>
  );
}
