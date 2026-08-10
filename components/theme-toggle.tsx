"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";

type ThemeToggleProps = {
  tone?: "on-dark" | "on-light" | "auto";
  className?: string;
};

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="8" r="2.7" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M12.6 3.4L11.5 4.5M4.5 11.5L3.4 12.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12.6 10.2A5.6 5.6 0 0 1 5.8 3.4a5.1 5.1 0 1 0 6.8 6.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Segmented light/dark control — pill-like geometry, orange thumb marks
 * the active segment. Thumb moves on transform only (no layout jumps).
 * Rim colors live in globals.css (.theme-toggle) so they are not overridden
 * by Tailwind's bare `border` utility setting --color-border.
 */
export function ThemeToggle({
  tone = "auto",
  className = "",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const t = useDictionary().theme;
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t.toLight : t.toDark}
      aria-pressed={isDark}
      data-tone={tone}
      className={`theme-toggle relative inline-flex h-9 w-[4.5rem] shrink-0 items-center rounded-[10px] border p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <span
        aria-hidden
        className={`absolute left-1 top-1 h-7 w-8 rounded-[7px] bg-accent transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
          isDark ? "translate-x-[2rem]" : "translate-x-0"
        }`}
      />
      <span aria-hidden className="relative z-[1] grid w-full grid-cols-2">
        <span className="flex h-7 items-center justify-center">
          <SunIcon
            className={`transition-colors duration-200 ${
              isDark ? "" : "text-white"
            }`}
          />
        </span>
        <span className="flex h-7 items-center justify-center">
          <MoonIcon
            className={`transition-colors duration-200 ${
              isDark ? "text-white" : ""
            }`}
          />
        </span>
      </span>
    </button>
  );
}
