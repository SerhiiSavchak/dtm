"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useMagnetic } from "./fx/magnetic";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";
import { navHrefs } from "@/lib/i18n/dictionaries";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const DESKTOP_NAV_MQ = "(min-width: 1280px)";

function visibleFocusable(root: ParentNode) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
    if (el.closest("[inert]")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    return el.getClientRects().length > 0;
  });
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
  const [desktopNav, setDesktopNav] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(3);
  const menuId = useId();
  const menuOpen = menuPhase === "open";
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
    const mq = window.matchMedia(DESKTOP_NAV_MQ);
    const sync = () => {
      const desktop = mq.matches;
      setDesktopNav(desktop);
      if (desktop) {
        pendingAnchorRef.current = null;
        setMenuPhase("closed");
      }
    };
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

  const openMenu = useCallback(() => {
    setMenuPhase((phase) => (phase === "closed" ? "open" : phase));
  }, []);

  const closeMenu = useCallback((restoreFocus = true) => {
    if (menuPhase !== "open") return;
    if (restoreFocus) burgerRef.current?.focus();
    setMenuPhase("closing");
  }, [menuPhase]);

  const scrollToHash = useCallback(
    (hash: string) => {
      const id = hash.replace(/^#/, "");
      if (!id) return;
      const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
      if (id === "top") {
        window.scrollTo({ top: 0, behavior });
        window.history.pushState(null, "", "#top");
        return;
      }
      const target = document.getElementById(id);
      if (!target) return;
      const headerPx =
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-h"
          )
        ) || 80;
      const y =
        window.scrollY + target.getBoundingClientRect().top - headerPx - 12;
      window.scrollTo({ top: Math.max(0, y), behavior });
      window.history.pushState(null, "", `#${id}`);
    },
    [reduceMotion]
  );

  /** Menu link: close first, then offset-scroll after exit (body overflow restored). */
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
      burgerRef.current?.focus();
      setMenuPhase("closed");
      requestAnimationFrame(() => {
        const hash = pendingAnchorRef.current;
        pendingAnchorRef.current = null;
        if (hash) scrollToHash(hash);
      });
      return;
    }

    closeMenu(false);
  }

  useEffect(() => {
    if (menuPhase !== "open") return;
    const menu = menuRef.current;
    const header = menu?.ownerDocument.querySelector(".site-header");
    const firstLink = menu?.querySelector<HTMLElement>(".mobile-menu-link");
    firstLink?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        pendingAnchorRef.current = null;
        closeMenu(true);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = [
        ...(header ? visibleFocusable(header) : []),
        ...(menu ? visibleFocusable(menu) : []),
      ];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !nodes.includes(active as HTMLElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuPhase, closeMenu]);

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
  }, [menuPhase, reduceMotion, scrollToHash]);

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
        className={`site-header fixed inset-x-0 top-0 z-[90] transition-[background-color,opacity,box-shadow,visibility] duration-500 ${
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
              if (menuOpen) onMobileNavClick(e, "#top");
            }}
          >
            <Logo tone={tone} withDescriptor />
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
                ref={ctaRef}
                href={navHrefs.estimate}
                className={`header-cta btn btn-primary arch-magnetic whitespace-nowrap ${
                  solid ? "" : "btn-on-dark"
                }`}
              >
                {t.nav.estimateCta}
              </a>
            </div>

            <button
              type="button"
              ref={burgerRef}
              onClick={() => {
                if (desktopNav) return;
                if (menuOpen) {
                  pendingAnchorRef.current = null;
                  closeMenu(false);
                } else {
                  openMenu();
                }
              }}
              aria-expanded={desktopNav ? false : menuOpen}
              aria-controls={desktopNav ? undefined : menuId}
              aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
              aria-hidden={desktopNav || undefined}
              tabIndex={desktopNav ? -1 : undefined}
              inert={desktopNav || undefined}
              data-open={menuOpen ? "true" : "false"}
              className="header-menu-toggle nav:hidden"
            >
              <span
                aria-hidden
                className={`header-menu-line header-menu-line-1 ${
                  !solid ? "bg-paper" : "bg-foreground"
                }`}
              />
              <span
                aria-hidden
                className={`header-menu-line header-menu-line-2 ${
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
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="mobile-menu-shell container-dtm">
          <div className="mobile-menu-chrome" aria-hidden="true" />
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
            <a
              href={navHrefs.estimate}
              onClick={(e) => onMobileNavClick(e, navHrefs.estimate)}
              className="btn btn-primary mobile-menu-cta"
            >
              {t.nav.estimateCta}
            </a>

            <div className="mobile-menu-utility-row">
              <ThemeToggle
                size="lg"
                tone={theme === "dark" ? "on-dark" : "on-light"}
                className="mobile-menu-theme"
              />
              <div
                className="mobile-menu-lang"
                role="group"
                aria-label={t.lang.groupAria}
              >
                {(["uk", "en"] as const).map((code) => {
                  const selected = locale === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        if (!selected) toggleLocale();
                      }}
                      aria-pressed={selected}
                      aria-current={selected ? "true" : undefined}
                      className="mobile-menu-lang-btn"
                    >
                      {code === "uk" ? "UA" : "EN"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
