"use client";

import { Reveal } from "./reveal";

type SectionHeadProps = {
  label: string;
  right?: string;
  onDark?: boolean;
};

/** Shared section label + rule — consistent spacing across the page */
export function SectionHead({ label, right, onDark = false }: SectionHeadProps) {
  return (
    <Reveal
      as="div"
      className={`section-head flex items-center justify-between ${
        onDark ? "border-white/15" : "border-border"
      }`}
    >
      <span className="label text-accent">{label}</span>
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
