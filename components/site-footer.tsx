"use client";

import { Logo } from "./logo";
import { useDictionary } from "@/lib/i18n/locale-context";
import { navHrefs } from "@/lib/i18n/dictionaries";
import { socialLinks } from "@/data/media";
import { useTheme } from "@/lib/theme/theme-context";
import { Reveal } from "./reveal";

export function SiteFooter() {
  const t = useDictionary();
  const { theme } = useTheme();

  const links = [
    { label: t.nav.services, href: navHrefs.services },
    { label: t.nav.projects, href: navHrefs.projects },
    { label: t.nav.process, href: navHrefs.process },
    { label: t.nav.about, href: navHrefs.about },
    { label: t.nav.contact, href: navHrefs.contact },
  ];

  return (
    <footer id="contacts" className="mt-auto bg-bg text-foreground">
      <div className="container-dtm section-pad-sm">
        <Reveal>
          <div className="flex flex-col items-center border-t border-border pt-10 text-center md:pt-12">
            <p className="type-h1 max-w-[18ch] text-balance text-foreground">
              {t.finalCta.headingBefore}{" "}
              <span className="text-accent">{t.finalCta.headingAfter}</span>
            </p>
            <p className="type-body-lg mt-5 max-w-lg text-muted lg:mt-6">
              {t.finalCta.body}
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto lg:mt-10 lg:flex-row lg:items-center lg:justify-center lg:gap-4">
              <a href="#estimate" className="btn btn-primary group max-lg:w-full">
                {t.finalCta.primary}
                <span className="btn-arrow" aria-hidden>
                  →
                </span>
              </a>
              <a
                href={socialLinks.telegram}
                className="btn btn-secondary group max-lg:w-full"
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

        <div className="mt-12 border-t border-border pt-8 md:mt-14 md:pt-10 lg:mt-14 lg:pt-8">
          {/* Mobile / tablet — stacked, centered. Unchanged composition. */}
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center md:gap-10 lg:hidden">
            <div className="flex flex-col items-center">
              <Logo tone={theme === "dark" ? "paper" : "ink"} withDescriptor />
              <p className="type-body-sm mt-4 max-w-sm text-muted">
                {t.footer.tagline}
              </p>
            </div>

            <nav
              aria-label={t.nav.mainAria}
              className="flex max-w-xs flex-col items-center gap-0 sm:max-w-xl sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6"
            >
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center text-base text-foreground/80 transition-colors hover:text-accent"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex flex-col items-center gap-0">
              <span className="label text-muted">{t.footer.locationLabel}</span>
              <p className="flex min-h-11 items-center text-base text-foreground/80">
                {t.footer.location}
              </p>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center text-base text-foreground/80 transition-colors hover:text-accent"
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Desktop — equal side columns keep nav in the true center */}
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start lg:gap-x-8 xl:gap-x-10 2xl:gap-x-12">
            <div className="flex min-w-0 flex-col items-start justify-self-start text-left">
              <Logo tone={theme === "dark" ? "paper" : "ink"} withDescriptor />
              <p className="type-body-sm mt-2.5 max-w-[20rem] text-muted">
                {t.footer.tagline}
              </p>
            </div>

            <nav
              aria-label={t.nav.mainAria}
              className="flex flex-nowrap items-center justify-center gap-x-5 pt-1.5 xl:gap-x-6 2xl:gap-x-7"
            >
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="type-body whitespace-nowrap py-1 text-foreground/80 transition-colors hover:text-accent"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-start justify-end justify-self-end gap-x-8 pt-1.5 xl:gap-x-10">
              <div className="flex flex-col items-start text-left">
                <span className="label text-muted">{t.footer.locationLabel}</span>
                <p className="mt-2 type-body-sm text-foreground/80">
                  {t.footer.location}
                </p>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="label text-muted">{t.footer.socialLabel}</span>
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 type-body-sm text-foreground/80 transition-colors hover:text-accent"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 border-t border-border pt-5 text-center sm:flex-row sm:gap-8 lg:mt-6 lg:items-center lg:justify-between lg:pt-4 lg:text-left">
          <span className="label text-muted">
            © {new Date().getFullYear()} {t.footer.copyright}
          </span>
          <span className="label text-muted/80">{t.footer.localeMark}</span>
        </div>
      </div>
    </footer>
  );
}
