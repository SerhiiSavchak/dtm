"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";
import { navHrefs } from "@/lib/i18n/dictionaries";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

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
    if (!menuVisible) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [menuVisible]);

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
        setMenuPhase("closing");
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

  const solid = scrolled || menuVisible;
  const onDarkChrome = !solid || theme === "dark";
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
        className={`site-header fixed inset-x-0 top-0 z-[70] transition-[background-color,opacity,box-shadow,visibility] duration-500 ${
          !boot
            ? "pointer-events-none invisible opacity-0"
            : "is-booted opacity-100"
        } ${
          solid ? "site-header-solid bg-background" : "bg-transparent"
        }`}
        aria-hidden={!boot}
      >
        <div className="container-dtm grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 nav:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <a
            href="#top"
            className="justify-self-start flex items-center"
            aria-label={t.nav.homeAria}
            onClick={(e) => {
              if (menuPhase === "open") onMobileNavClick(e, "#top");
            }}
          >
            <Logo tone={tone} withDescriptor className="hidden sm:block" />
            <Logo tone={tone} withDescriptor={false} className="sm:hidden" />
          </a>

          <nav
            aria-label={t.nav.mainAria}
            className="hidden items-center gap-4 justify-self-center min-[1440px]:gap-6 min-[1600px]:gap-8 nav:flex"
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

          <div className="col-start-2 flex min-w-0 items-center justify-self-end nav:col-start-3">
            <div className="hidden items-center gap-3 nav:flex min-[1440px]:gap-3.5">
              <ThemeToggle
                tone={
                  !solid
                    ? "on-dark"
                    : theme === "dark"
                      ? "on-dark"
                      : "on-light"
                }
              />

              <button
                type="button"
                onClick={toggleLocale}
                aria-label={
                  locale === "uk" ? t.lang.toEn : t.lang.toUk
                }
                className={`label hidden px-1.5 transition-colors nav:inline-block ${
                  solid
                    ? "text-muted hover:text-foreground"
                    : "text-paper/65 hover:text-paper"
                }`}
              >
                {locale === "uk" ? "EN" : "UA"}
              </button>
            </div>

            <div className="ml-6 hidden nav:block min-[1440px]:ml-8 min-[1600px]:ml-10">
              <a
                href={navHrefs.estimate}
                className={`header-cta btn whitespace-nowrap ${
                  solid
                    ? theme === "dark"
                      ? "btn-primary"
                      : "btn-ink"
                    : "btn-primary"
                }`}
              >
                {t.nav.estimateCta}
              </a>
            </div>

            <button
              type="button"
              ref={burgerRef}
              onClick={() => {
                if (menuPhase === "open") {
                  pendingAnchorRef.current = null;
                  closeMenu();
                } else {
                  openMenu();
                }
              }}
              aria-expanded={menuVisible}
              aria-controls={menuId}
              aria-label={menuVisible ? t.nav.closeMenu : t.nav.openMenu}
              data-open={menuVisible ? "true" : "false"}
              className="header-menu-toggle relative flex shrink-0 items-center justify-center nav:hidden"
            >
              <span className="sr-only">
                {menuVisible ? t.nav.closeMenu : t.nav.openMenu}
              </span>
              <span
                aria-hidden
                className={`header-menu-line header-menu-line-1 absolute block h-0.5 w-8 ${
                  !solid ? "bg-paper" : "bg-foreground"
                }`}
              />
              <span
                aria-hidden
                className={`header-menu-line header-menu-line-2 absolute block h-0.5 w-8 ${
                  !solid ? "bg-paper" : "bg-foreground"
                }`}
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
                size="lg"
                tone={theme === "dark" ? "on-dark" : "on-light"}
              />
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label={t.lang.groupAria}
              >
                {(["uk", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      if (locale !== code) toggleLocale();
                    }}
                    aria-pressed={locale === code}
                    className={`min-h-11 min-w-11 px-3 text-sm font-medium tracking-[0.14em] transition-colors ${
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
              className="btn btn-primary btn-lg mt-5 w-full"
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
