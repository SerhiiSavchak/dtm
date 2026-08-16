"use client";

import { Reveal } from "./reveal";

type SectionHeadProps = {
  label: string;
  right?: string;
  onDark?: boolean;
};

/**
 * Strip legacy template counters: "(01) — Label" → "Label".
 * Keeps SectionHead reusable as copy is cleaned over time.
 */
export function cleanSectionLabel(label: string) {
  return label.replace(/^\(\d{1,2}\)\s*[—–-]\s*/u, "").trim();
}

/** Shared section eyebrow — orange rule + label, no decorative numbering */
export function SectionHead({ label, right, onDark = false }: SectionHeadProps) {
  const text = cleanSectionLabel(label);

  return (
    <Reveal
      as="div"
      className={`section-head flex items-center justify-between ${
        onDark ? "border-white/15" : "border-border"
      }`}
    >
      <span className="flex items-center gap-3">
        <span aria-hidden className="h-px w-7 shrink-0 bg-accent" />
        <span className="label text-accent">{text}</span>
      </span>
      {right ? (
        <span
          className={`label hidden sm:block ${
            onDark ? "text-paper/45" : "text-muted"
          }`}
        >
          {right}
        </span>
      ) : null}
    </Reveal>
  );
}
