"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";
import { navHrefs } from "@/lib/i18n/dictionaries";

export function SiteHeader({ boot = true }: { boot?: boolean }) {
  const t = useDictionary();
  const { locale, toggleLocale } = useLocale();
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (menuOpen) closeRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const solid = scrolled || menuOpen;
  const onDarkChrome = menuOpen || !solid || theme === "dark";
  const tone = onDarkChrome ? "paper" : "ink";

  const links = [
    { label: t.nav.services, href: navHrefs.services },
    { label: t.nav.projects, href: navHrefs.projects },
    { label: t.nav.process, href: navHrefs.process },
    { label: t.nav.about, href: navHrefs.about },
    { label: t.nav.contact, href: navHrefs.contact },
  ];

  return (
    <>
      <header
        className={`site-header fixed inset-x-0 top-0 z-[70] transition-[background-color,opacity,box-shadow] duration-500 ${
          boot ? "opacity-100" : "opacity-0"
        } ${
          menuOpen
            ? "bg-ink-deep"
            : solid
              ? "site-header-solid bg-background"
              : "bg-transparent"
        }`}
        style={{ height: "var(--header-h)" }}
      >
        <div className="container-dtm flex h-full items-center justify-between gap-4">
          <a
            href="#top"
            className="flex items-center"
            aria-label={t.nav.homeAria}
            onClick={() => setMenuOpen(false)}
          >
            <Logo tone={tone} withDescriptor className="hidden sm:block" />
            <Logo tone={tone} withDescriptor={false} className="sm:hidden" />
          </a>

          <nav
            aria-label={t.nav.mainAria}
            className="hidden items-center gap-8 xl:flex"
          >
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`group relative text-[0.9375rem] font-medium tracking-[-0.01em] transition-colors ${
                  solid && !menuOpen
                    ? "text-foreground/75 hover:text-foreground"
                    : "text-paper/85 hover:text-paper"
                }`}
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full group-focus-visible:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme + locale live in the mobile menu below xl */}
            <div className="hidden xl:block">
              {/* Transparent Hero: always light rim. Solid header: theme-aware. */}
              <ThemeToggle
                tone={
                  !solid || menuOpen
                    ? "on-dark"
                    : theme === "dark"
                      ? "on-dark"
                      : "on-light"
                }
              />
            </div>

            <button
              type="button"
              onClick={toggleLocale}
              aria-label={
                locale === "uk" ? "Switch to English" : "Перейти на українську"
              }
              className={`label hidden px-1 transition-colors xl:inline-block ${
                solid && !menuOpen
                  ? "text-muted hover:text-foreground"
                  : "text-paper/65 hover:text-paper"
              }`}
            >
              {locale === "uk" ? "EN" : "UA"}
            </button>

            <a
              href={navHrefs.estimate}
              className={`btn btn-sm btn-compact whitespace-nowrap ${
                menuOpen
                  ? "btn-primary"
                  : solid
                    ? theme === "dark"
                      ? "btn-primary"
                      : "btn-ink"
                    : "btn-primary"
              }`}
            >
              {t.nav.estimate}
            </a>

            <button
              type="button"
              ref={closeRef}
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
              className="relative z-[80] flex h-10 w-10 flex-col items-center justify-center gap-1.5 xl:hidden"
            >
              <span
                className={`block h-px w-6 origin-center transition-transform duration-300 ${
                  menuOpen || !solid ? "bg-paper" : "bg-foreground"
                } ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
              />
              <span
                className={`block h-px w-6 origin-center transition-transform duration-300 ${
                  menuOpen || !solid ? "bg-paper" : "bg-foreground"
                } ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        id={menuId}
        className={`mobile-menu xl:hidden ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="container-dtm flex h-full flex-col pb-8 pt-[calc(var(--header-h)+1rem)]">
          <nav
            aria-label={t.nav.mobileAria}
            className="flex flex-1 flex-col justify-center"
          >
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="mobile-menu-item group flex items-center gap-4 border-b border-white/10 py-[clamp(0.875rem,2.4svh,1.25rem)] text-[clamp(1.625rem,5.5vw,2.5rem)] font-semibold tracking-tight text-paper"
              >
                <span
                  aria-hidden
                  className="h-px w-5 shrink-0 bg-accent transition-all duration-300 group-hover:w-8 group-focus-visible:w-8"
                />
                {item.label}
              </a>
            ))}
          </nav>

          {/* Utility area: theme + language, then final CTA */}
          <div className="mobile-menu-item mobile-menu-utility pt-6">
            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <ThemeToggle tone="on-dark" />
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Мова / Language"
              >
                {(["uk", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      if (locale !== code) toggleLocale();
                    }}
                    aria-pressed={locale === code}
                    className={`label px-3 py-2 transition-colors ${
                      locale === code
                        ? "text-accent"
                        : "text-paper/45 hover:text-paper"
                    }`}
                  >
                    {code === "uk" ? "UA" : "EN"}
                  </button>
                ))}
              </div>
            </div>
            <a
              href={navHrefs.estimate}
              onClick={() => setMenuOpen(false)}
              className="btn btn-primary mt-5 w-full"
            >
              {t.hero.ctaPrimary}
              <span className="btn-arrow" aria-hidden>
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
