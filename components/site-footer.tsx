"use client";

import { Logo } from "./logo";
import { useDictionary } from "@/lib/i18n/locale-context";
import { navHrefs } from "@/lib/i18n/dictionaries";
import { socialLinks } from "@/data/media";
import { Reveal } from "./reveal";

export function SiteFooter() {
  const t = useDictionary();

  const links = [
    { label: t.nav.services, href: navHrefs.services },
    { label: t.nav.projects, href: navHrefs.projects },
    { label: t.nav.process, href: navHrefs.process },
    { label: t.nav.about, href: navHrefs.about },
    { label: t.nav.contact, href: navHrefs.contact },
  ];

  return (
    <footer id="contacts" className="mt-auto bg-ink-deep text-paper">
      <div className="container-dtm section-pad-sm">
        {/* Final scene: large statement + CTA cluster on one baseline */}
        <Reveal>
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 border-t border-white/15 pt-10 md:pt-14 lg:grid-cols-12 lg:items-end">
            <p className="type-h1 max-w-[18ch] text-balance text-paper lg:col-span-8">
              {t.finalCta.headingBefore}{" "}
              <span className="text-accent">{t.finalCta.headingAfter}</span>
            </p>
            <div className="flex flex-col items-start gap-4 lg:col-span-4 lg:items-end lg:pb-2">
              <a href="#estimate" className="btn btn-primary">
                {t.finalCta.primary}
                <span className="btn-arrow" aria-hidden>
                  →
                </span>
              </a>
              <a
                href={socialLinks.telegram}
                className="btn btn-text group text-paper/80 hover:text-paper"
                target={
                  socialLinks.telegram.startsWith("http") ? "_blank" : undefined
                }
                rel={
                  socialLinks.telegram.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {t.finalCta.telegram}
                <span className="btn-arrow" aria-hidden>
                  →
                </span>
              </a>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 border-t border-white/15 pt-10 md:mt-20 md:grid-cols-12 md:pt-12">
          <div className="md:col-span-5">
            <div className="origin-top-left scale-110 md:scale-125">
              <Logo tone="paper" withDescriptor />
            </div>
            <p className="mt-7 max-w-xs text-sm leading-relaxed text-paper/65 md:mt-8">
              {t.footer.tagline}
            </p>
          </div>

          <nav
            aria-label={t.nav.mainAria}
            className="flex flex-col gap-3 md:col-span-3"
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

          <div className="flex flex-col gap-3 md:col-span-4">
            <span className="label text-paper/45">{t.footer.locationLabel}</span>
            <p className="text-sm text-paper/80">{t.footer.location}</p>
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-fit text-sm text-paper/80 transition-colors hover:text-accent"
            >
              Instagram
            </a>
            <a
              href="#estimate"
              className="w-fit text-sm text-accent transition-colors hover:text-paper"
            >
              {t.nav.estimate}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-center">
          <span className="label text-paper/45">
            © {new Date().getFullYear()} {t.footer.copyright}
          </span>
          <span className="label text-paper/35">{t.footer.localeMark}</span>
        </div>
      </div>
    </footer>
  );
}
