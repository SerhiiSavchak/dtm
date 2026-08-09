"use client";

import { Logo } from "./logo";
import { useDictionary } from "@/lib/i18n/locale-context";
import { navHrefs } from "@/lib/i18n/dictionaries";

export function SiteFooter() {
  const t = useDictionary();

  const links = [
    { label: t.nav.services, href: navHrefs.services },
    { label: t.nav.projects, href: navHrefs.projects },
    { label: t.nav.about, href: navHrefs.about },
    { label: t.nav.contact, href: navHrefs.contact },
  ];

  return (
    <footer
      id="contacts"
      className="mt-auto bg-ink-deep text-paper"
      aria-label="Footer"
    >
      <div className="container-dtm py-14 md:py-16">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo tone="paper" withDescriptor />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-paper/70">
              {t.footer.tagline}
            </p>
          </div>

          <nav
            aria-label={t.nav.mainAria}
            className="flex flex-col gap-3 md:col-span-4"
          >
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="w-fit text-sm text-paper/80 transition-colors hover:text-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3 md:col-span-3">
            <span className="label text-paper/50">{t.footer.locationLabel}</span>
            <p className="text-sm text-paper/80">{t.footer.location}</p>
            <a
              href="#estimate"
              className="mt-2 w-fit text-sm text-accent transition-colors hover:text-paper"
            >
              {t.nav.estimate}
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-center">
          <span className="label text-paper/50">
            © {new Date().getFullYear()} {t.footer.copyright}
          </span>
          <span className="label text-paper/40">{t.footer.localeMark}</span>
        </div>
      </div>
    </footer>
  );
}
