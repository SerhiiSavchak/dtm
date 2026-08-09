"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";
import { navHrefs } from "@/lib/i18n/dictionaries";

export function SiteHeader() {
  const t = useDictionary();
  const { locale, toggleLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
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
  // Brand ink/paper stay constant — on dark chrome use light mark strokes
  const tone = !solid || theme === "dark" ? "paper" : "ink";

  const links = [
    { label: t.nav.services, href: navHrefs.services },
    { label: t.nav.projects, href: navHrefs.projects },
    { label: t.nav.about, href: navHrefs.about },
    { label: t.nav.contact, href: navHrefs.contact },
  ];

  return (
    <header
      className={`hero-nav-settle fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,color] duration-500 ${
        solid
          ? "border-b border-border bg-surface/92 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
      style={{ height: "var(--header-h)" }}
    >
      <div className="container-dtm flex h-full items-center justify-between gap-4">
        <a href="#top" className="flex items-center" aria-label={t.nav.homeAria}>
          <Logo tone={tone} withDescriptor className="hidden sm:block" />
          <Logo tone={tone} withDescriptor={false} className="sm:hidden" />
        </a>

        <nav
          aria-label={t.nav.mainAria}
          className="hidden items-center gap-8 lg:flex"
        >
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`group relative text-sm font-medium transition-colors ${
                solid
                  ? "text-foreground/75 hover:text-foreground"
                  : "text-paper/85 hover:text-paper"
              }`}
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full group-focus-visible:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t.theme.toLight : t.theme.toDark}
            className={`hidden h-9 w-9 items-center justify-center transition-colors sm:inline-flex ${
              solid ? "text-muted hover:text-foreground" : "text-paper/60 hover:text-paper"
            }`}
          >
            <span
              aria-hidden
              className={`block h-3.5 w-3.5 border ${
                solid ? "border-current" : "border-current"
              } ${theme === "dark" ? "bg-current" : "bg-transparent"}`}
            />
          </button>

          <button
            type="button"
            onClick={toggleLocale}
            aria-label={locale === "uk" ? "Switch to English" : "Перейти на українську"}
            className={`label px-1 transition-colors ${
              solid ? "text-muted hover:text-foreground" : "text-paper/65 hover:text-paper"
            }`}
          >
            {locale === "uk" ? "EN" : "UA"}
          </button>

          <a
            href={navHrefs.estimate}
            className={`hidden items-center px-5 py-2.5 text-sm font-medium transition-colors duration-300 md:inline-flex ${
              solid
                ? theme === "dark"
                  ? "bg-paper text-ink hover:bg-accent hover:text-white"
                  : "bg-ink text-paper hover:bg-accent hover:text-white"
                : "bg-accent text-white hover:bg-paper hover:text-ink"
            }`}
          >
            {t.nav.estimate}
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={`block h-px w-6 transition-transform duration-300 ${
                solid ? "bg-foreground" : "bg-paper"
              } ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-6 transition-transform duration-300 ${
                solid ? "bg-foreground" : "bg-paper"
              } ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Full-screen mobile navigation */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 top-[var(--header-h)] z-40 bg-surface transition-[opacity,visibility] duration-500 lg:hidden ${
          menuOpen
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
      >
        <nav
          aria-label={t.nav.mobileAria}
          className="container-dtm flex h-full flex-col justify-between py-8"
        >
          <div className="flex flex-col">
            {links.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-baseline gap-4 border-b border-border py-5 text-3xl font-semibold tracking-tight text-foreground"
              >
                <span className="font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            ))}
          </div>

          <div className="space-y-4 pb-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleLocale}
                className="label text-muted hover:text-foreground"
              >
                {locale === "uk" ? "EN" : "UA"}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="label text-muted hover:text-foreground"
              >
                {theme === "dark" ? t.theme.toLight : t.theme.toDark}
              </button>
            </div>
            <a
              href={navHrefs.estimate}
              onClick={() => setMenuOpen(false)}
              className="btn btn-ink w-full"
            >
              {t.hero.ctaPrimary}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
