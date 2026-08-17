"use client";

import { useDictionary } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";

type ThemeToggleProps = {
  tone?: "on-dark" | "on-light" | "auto";
  size?: "md" | "lg";
  className?: string;
};

function SunIcon({ className, size }: { className?: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="8" r="2.45" fill="currentColor" />
      <path
        d="M8 1.6V3.05M8 12.95V14.4M1.6 8H3.05M12.95 8H14.4M3.5 3.5L4.52 4.52M11.48 11.48L12.5 12.5M12.5 3.5L11.48 4.52M4.52 11.48L3.5 12.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className, size }: { className?: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      {/* Filled crescent; path mass is centered in the 16×16 viewBox */}
      <path d="M8.35 2.4A5.7 5.7 0 1 0 13.05 11.7 4.75 4.75 0 0 1 8.35 2.4Z" />
    </svg>
  );
}

/**
 * Segmented light/dark control — pill-like geometry, orange thumb marks
 * the active segment. Thumb width is always 50% of the inner track so both
 * icons stay centered in identical slots; movement is transform-only.
 */
export function ThemeToggle({
  tone = "auto",
  size = "md",
  className = "",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const t = useDictionary().theme;
  const isDark = theme === "dark";
  const large = size === "lg";
  const iconSize = large ? 22 : 14;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t.toLight : t.toDark}
      aria-pressed={isDark}
      data-tone={tone}
      className={`theme-toggle relative grid shrink-0 grid-cols-2 items-stretch rounded-[10px] border p-1 leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        large ? "h-12 w-[6.5rem]" : "h-9 w-[4.5rem]"
      } ${className}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-[7px] bg-accent transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
          isDark ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <span className="relative z-[1] flex items-center justify-center">
        <span
          className={`flex items-center justify-center leading-none ${
            large ? "size-[22px]" : "size-[15px]"
          }`}
        >
          <SunIcon
            size={iconSize}
            className={`block size-full transition-colors duration-200 ${
              isDark ? "" : "text-white"
            }`}
          />
        </span>
      </span>
      <span className="relative z-[1] flex items-center justify-center">
        <span
          className={`flex items-center justify-center leading-none ${
            large ? "size-[22px]" : "size-[15px]"
          }`}
        >
          <MoonIcon
            size={iconSize}
            className={`block size-full transition-colors duration-200 ${
              isDark ? "text-white" : ""
            }`}
          />
        </span>
      </span>
    </button>
  );
}
