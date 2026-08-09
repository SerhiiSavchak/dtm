"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { nav } from "@/data/content";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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

  // Solid/light chrome when scrolled or menu open; otherwise light-on-dark hero.
  const solid = scrolled || menuOpen;
  const tone = solid ? "ink" : "paper";

  return (
    <header
      className={`reveal-fade fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid
          ? "bg-paper/90 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
      style={{ height: "var(--header-h)" }}
    >
      <div className="container-dtm flex h-full items-center justify-between">
        <a
          href="#top"
          className="flex items-center"
          aria-label="DTM — на початок"
        >
          <Logo tone={tone} withDescriptor className="hidden sm:block" />
          <Logo tone={tone} withDescriptor={false} className="sm:hidden" />
        </a>

        {/* Desktop nav */}
        <nav
          aria-label="Головна навігація"
          className="hidden md:flex items-center gap-9"
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`group relative text-sm font-medium transition-colors ${
                solid ? "text-ink/75 hover:text-ink" : "text-paper/85 hover:text-paper"
              }`}
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#estimate"
            className={`hidden sm:inline-flex items-center text-sm font-medium px-5 py-2.5 transition-colors duration-300 ${
              solid
                ? "bg-ink text-paper hover:bg-accent"
                : "bg-accent text-paper hover:bg-paper hover:text-ink"
            }`}
          >
            Розрахувати вартість
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
            className="md:hidden flex flex-col justify-center gap-1.5 w-10 h-10 items-center"
          >
            <span
              className={`block h-px w-6 transition-transform duration-300 ${
                solid ? "bg-ink" : "bg-paper"
              } ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-6 transition-transform duration-300 ${
                solid ? "bg-ink" : "bg-paper"
              } ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden bg-paper transition-[max-height] duration-500 ease-out ${
          menuOpen ? "max-h-[80vh] border-b border-border" : "max-h-0"
        }`}
      >
        <nav
          aria-label="Мобільна навігація"
          className="container-dtm flex flex-col gap-1 pb-6 pt-2"
        >
          {nav.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-baseline gap-4 py-3 text-2xl font-semibold tracking-tight text-ink border-b border-border"
            >
              <span className="font-mono text-xs text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item.label}
            </a>
          ))}
          <a
            href="#estimate"
            onClick={() => setMenuOpen(false)}
            className="mt-4 inline-flex items-center justify-center bg-ink text-paper text-base font-medium px-5 py-3.5 hover:bg-accent transition-colors"
          >
            Отримати попередній розрахунок
          </a>
        </nav>
      </div>
    </header>
  );
}
