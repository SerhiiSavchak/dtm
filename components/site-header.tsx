"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";
import { navHrefs } from "@/lib/i18n/dictionaries";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SiteHeader({ boot = true }: { boot?: boolean }) {
  const t = useDictionary();
  const { locale, toggleLocale } = useLocale();
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  /** closed → open (enter) → closing (exit) → closed */
  const [menuPhase, setMenuPhase] = useState<"closed" | "open" | "closing">(
    "closed"
  );
  const [reduceMotion, setReduceMotion] = useState(false);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const menuVisible = menuPhase !== "closed";
  const pendingAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuVisible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuVisible]);

  useEffect(() => {
    if (menuPhase === "open") menuCloseRef.current?.focus();
  }, [menuPhase]);

  function openMenu() {
    if (menuPhase !== "closed") return;
    setMenuPhase("open");
  }

  function closeMenu() {
    if (menuPhase !== "open") return;
    setMenuPhase("closing");
  }

  function scrollToHash(hash: string) {
    const id = hash.replace(/^#/, "");
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    target.scrollIntoView({ behavior, block: "start" });
    window.history.pushState(null, "", `#${id}`);
  }

  /** Menu link: close first, then smooth-scroll after exit (body overflow restored). */
  function onMobileNavClick(
    e: MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    pendingAnchorRef.current = href;

    if (menuPhase !== "open") {
      const hash = pendingAnchorRef.current;
      pendingAnchorRef.current = null;
      if (hash) scrollToHash(hash);
      return;
    }

    if (reduceMotion) {
      setMenuPhase("closed");
      // overflow clears on next paint
      requestAnimationFrame(() => {
        const hash = pendingAnchorRef.current;
        pendingAnchorRef.current = null;
        if (hash) scrollToHash(hash);
      });
      return;
    }

    setMenuPhase("closing");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuPhase === "open") {
        pendingAnchorRef.current = null;
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuPhase]);

  // Finish exit, then optional pending anchor scroll
  useEffect(() => {
    if (menuPhase !== "closing") return;
    const el = menuRef.current;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setMenuPhase("closed");
      const hash = pendingAnchorRef.current;
      pendingAnchorRef.current = null;
      // Wait until body overflow is restored, then scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (hash) scrollToHash(hash);
          else burgerRef.current?.focus();
        });
      });
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "opacity") return;
      finish();
    };
    el?.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(finish, reduceMotion ? 0 : 280);
    return () => {
      el?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [menuPhase, reduceMotion]);

  const solid = scrolled && !menuVisible;
  const onDarkChrome = !solid || theme === "dark";
  const tone = onDarkChrome ? "paper" : "ink";
  const menuLogoTone = theme === "dark" ? "paper" : "ink";

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
        className={`site-header fixed inset-x-0 top-0 z-[70] transition-[background-color,opacity,box-shadow,visibility] duration-500 ${
          !boot || menuVisible
            ? "pointer-events-none invisible opacity-0"
            : "opacity-100"
        } ${
          solid ? "site-header-solid bg-background" : "bg-transparent"
        }`}
        style={{ height: "var(--header-h)" }}
        aria-hidden={menuVisible}
      >
        <div className="container-dtm flex h-full items-center justify-between gap-3 nav:gap-4">
          <a
            href="#top"
            className="flex items-center"
            aria-label={t.nav.homeAria}
          >
            <Logo tone={tone} withDescriptor className="hidden sm:block" />
            <Logo tone={tone} withDescriptor={false} className="sm:hidden" />
          </a>

          <nav
            aria-label={t.nav.mainAria}
            className="hidden items-center gap-5 min-[1280px]:gap-6 min-[1440px]:gap-8 nav:flex"
          >
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`site-nav-link group relative text-[0.9375rem] font-medium tracking-[-0.01em] transition-colors duration-200 min-[1440px]:text-[1rem] ${
                  !solid
                    ? "is-on-dark text-paper/85 hover:text-paper"
                    : theme === "dark"
                      ? "is-on-dark text-foreground/80 hover:text-foreground"
                      : "is-on-light text-ink hover:text-accent"
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className="site-nav-underline absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-200 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 min-[1280px]:gap-3">
            <div className="hidden nav:block">
              <ThemeToggle
                tone={
                  !solid
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
              className={`label hidden px-1 transition-colors nav:inline-block ${
                solid
                  ? "text-muted hover:text-foreground"
                  : "text-paper/65 hover:text-paper"
              }`}
            >
              {locale === "uk" ? "EN" : "UA"}
            </button>

            <div className="hidden nav:block">
              <a
                href={navHrefs.estimate}
                className={`btn btn-sm btn-compact whitespace-nowrap ${
                  solid
                    ? theme === "dark"
                      ? "btn-primary"
                      : "btn-ink"
                    : "btn-primary"
                }`}
              >
                {t.nav.estimate}
              </a>
            </div>

            <button
              type="button"
              ref={burgerRef}
              onClick={openMenu}
              aria-expanded={menuVisible}
              aria-controls={menuId}
              aria-label={t.nav.openMenu}
              className="relative flex h-11 w-11 items-center justify-center nav:hidden"
            >
              <span className="sr-only">{t.nav.openMenu}</span>
              <span
                aria-hidden
                className={`absolute block h-px w-6 transition-colors ${
                  !solid ? "bg-paper" : "bg-foreground"
                } -translate-y-[3.5px]`}
              />
              <span
                aria-hidden
                className={`absolute block h-px w-6 transition-colors ${
                  !solid ? "bg-paper" : "bg-foreground"
                } translate-y-[3.5px]`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={menuRef}
        id={menuId}
        className="mobile-menu"
        data-state={menuPhase}
        data-motion={reduceMotion ? "reduce" : "full"}
        aria-hidden={!menuVisible}
        inert={!menuVisible}
      >
        <div className="mobile-menu-shell container-dtm">
          <div className="mobile-menu-top">
            <a
              href="#top"
              className="mobile-menu-item flex items-center"
              aria-label={t.nav.homeAria}
              onClick={(e) => onMobileNavClick(e, "#top")}
            >
              <Logo tone={menuLogoTone} withDescriptor={false} />
            </a>
            <button
              type="button"
              ref={menuCloseRef}
              onClick={() => {
                pendingAnchorRef.current = null;
                closeMenu();
              }}
              aria-label={t.nav.closeMenu}
              className="mobile-menu-item relative flex h-11 w-11 items-center justify-center"
            >
              <span className="sr-only">{t.nav.closeMenu}</span>
              <span
                aria-hidden
                className="absolute block h-px w-6 rotate-45 bg-foreground"
              />
              <span
                aria-hidden
                className="absolute block h-px w-6 -rotate-45 bg-foreground"
              />
            </button>
          </div>

          <nav aria-label={t.nav.mobileAria} className="mobile-menu-nav">
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => onMobileNavClick(e, item.href)}
                className="mobile-menu-item mobile-menu-link"
              >
                <span className="mobile-menu-link-inner">
                  <span aria-hidden className="mobile-menu-dot" />
                  <span>{item.label}</span>
                </span>
              </a>
            ))}
          </nav>

          <div className="mobile-menu-item mobile-menu-utility">
            <div className="mobile-menu-utility-row">
              <ThemeToggle
                tone={theme === "dark" ? "on-dark" : "on-light"}
              />
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
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {code === "uk" ? "UA" : "EN"}
                  </button>
                ))}
              </div>
            </div>
            <a
              href={navHrefs.estimate}
              onClick={(e) => onMobileNavClick(e, navHrefs.estimate)}
              className="btn btn-primary mt-4 w-full"
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
