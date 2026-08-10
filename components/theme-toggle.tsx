"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";

type ThemeToggleProps = {
  tone?: "on-dark" | "on-light" | "auto";
  className?: string;
};

/** Readable sun/moon toggle — ~40px height, clear glyphs */
export function ThemeToggle({
  tone = "auto",
  className = "",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const t = useDictionary().theme;
  const isDark = theme === "dark";

  const shell =
    tone === "on-dark"
      ? "border-white/30 text-paper"
      : tone === "on-light"
        ? "border-foreground/30 text-foreground"
        : "border-border text-foreground";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t.toLight : t.toDark}
      aria-pressed={isDark}
      className={`relative inline-flex h-10 w-[4.25rem] items-center border px-1.5 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${shell} ${className}`}
    >
      <span
        aria-hidden
        className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 bg-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isDark ? "translate-x-[1.7rem]" : "translate-x-0"
        }`}
      />
      <span
        aria-hidden
        className="relative z-[1] flex w-full items-center justify-between px-0.5"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M12.6 3.4L11.5 4.5M4.5 11.5L3.4 12.6"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="square"
          />
        </svg>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M11.2 10.4A5.4 5.4 0 0 1 5.6 4.8 4.7 4.7 0 1 0 11.2 10.4Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
