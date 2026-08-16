"use client";

import { Logo } from "./logo";
import { useDictionary } from "@/lib/i18n/locale-context";
import { navHrefs } from "@/lib/i18n/dictionaries";
import { externalLinkProps, socialLinks } from "@/data/media";
import { useTheme } from "@/lib/theme/theme-context";
import { CopyText } from "./copy-text";
import { Reveal } from "./reveal";
import { ArchitecturalRule } from "./fx/architectural-rule";
import { InteractiveArrow } from "./fx/interactive-arrow";
import { useMagnetic } from "./fx/magnetic";

export function SiteFooter() {
  const t = useDictionary();
  const { theme } = useTheme();
  const ctaRef = useMagnetic<HTMLAnchorElement>(4);

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
          <div className="final-cta-block flex flex-col items-center border-t-0 pt-10 text-center md:pt-12">
            <ArchitecturalRule />
            <p className="type-h1 max-w-[18ch] text-balance text-foreground">
              {t.finalCta.headingBefore}{" "}
              <span className="text-accent">{t.finalCta.headingAfter}</span>
            </p>
            <p className="type-body-lg mt-5 max-w-lg text-muted lg:mt-6">
              <CopyText>{t.finalCta.body}</CopyText>
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto lg:mt-10 lg:flex-row lg:items-center lg:justify-center lg:gap-4">
              <a
                ref={ctaRef}
                href="#estimate"
                className="btn btn-primary arch-magnetic group max-lg:w-full"
              >
                {t.finalCta.primary}
                <InteractiveArrow />
              </a>
              <a
                {...externalLinkProps(socialLinks.telegram)}
                className="btn btn-secondary group max-lg:w-full"
              >
                {t.finalCta.telegram}
                <InteractiveArrow />
              </a>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 border-t border-border pt-8 md:mt-14 md:pt-10 lg:mt-14 lg:pt-8">
          {/* Mobile / tablet — stacked, centered. Unchanged composition. */}
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center md:gap-10 nav:hidden">
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
                  className="flex min-h-11 items-center text-base text-foreground/80 arch-link hover:text-accent"
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
              <FooterSocial />
            </div>
          </div>

          {/* Desktop — equal side tracks keep nav on the container center */}
          <div className="hidden nav:grid nav:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] nav:items-center nav:gap-x-8 xl:gap-x-10">
            <div className="flex min-w-0 flex-col items-start justify-self-start text-left">
              <Logo tone={theme === "dark" ? "paper" : "ink"} withDescriptor />
              <p className="type-body-sm mt-2.5 max-w-[22rem] text-muted">
                {t.footer.tagline}
              </p>
            </div>

            <nav
              aria-label={t.nav.mainAria}
              className="flex flex-nowrap items-center justify-center gap-x-5 justify-self-center xl:gap-x-6 2xl:gap-x-7"
            >
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="arch-link type-body whitespace-nowrap py-1 text-foreground/80 hover:text-accent"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <FooterSocial className="justify-self-end" />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 border-t border-border pt-5 text-center sm:flex-row sm:gap-8 nav:mt-6 nav:items-center nav:justify-between nav:pt-4 nav:text-left">
          <span className="label text-muted">
            © {new Date().getFullYear()} {t.footer.copyright}
          </span>
          <span className="label text-muted/80">{t.footer.localeMark}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterSocial({ className = "" }: { className?: string }) {
  const t = useDictionary().footer;

  return (
    <nav aria-label={t.socialLabel} className={`footer-social ${className}`}>
      <a
        {...externalLinkProps(socialLinks.instagram)}
        aria-label={t.instagramAria}
      >
        <InstagramIcon />
        <span>{t.instagram}</span>
      </a>
      <a
        {...externalLinkProps(socialLinks.telegram)}
        aria-label={t.telegramAria}
      >
        <TelegramIcon />
        <span>{t.telegram}</span>
      </a>
    </nav>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="footer-social-icon"
    >
      <rect
        x="3.25"
        y="3.25"
        width="17.5"
        height="17.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.15" cy="6.85" r="1.05" fill="currentColor" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="footer-social-icon"
    >
      <path
        d="M20.75 4.35 3.9 11.2c-.95.38-.9 1.74.08 2.04l4.32 1.32 1.66 5.12c.28.86 1.38.98 1.84.2l2.38-4.08 4.72 3.46c.86.63 2.08.2 2.24-.86l1.72-12.1c.18-1.22-1.08-2.08-2.11-1.67Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.05 13.2 19.4 6.55"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
