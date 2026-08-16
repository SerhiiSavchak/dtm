type LogoProps = {
  /** Show the small "ДІМ ТВОЄЇ МРІЇ" descriptor line */
  withDescriptor?: boolean;
  /** Foreground of the house outline + descriptor. Wordmark stays DTM orange. */
  tone?: "ink" | "paper";
  className?: string;
};

/**
 * DTM identity — clean scalable vector rebuilt from the supplied reference:
 * an architectural house outline (open bracket with a short foot) framing the
 * orange "DTM" wordmark, above the "ДІМ ТВОЄЇ МРІЇ" descriptor.
 *
 * Reference truth: house outline = white/ink, wordmark = DTM orange.
 * Flat and sharp at any size — no gradients, glow or shadow.
 */
export function Logo({
  withDescriptor = true,
  tone = "ink",
  className,
}: LogoProps) {
  const stroke = tone === "paper" ? "var(--paper)" : "var(--ink)";
  const descColor = tone === "paper" ? "rgba(255,255,255,0.65)" : "var(--graphite)";

  return (
    <span
      className={className}
      aria-label="DTM — Дім Твоєї Мрії"
      role="img"
    >
      <span className="flex items-center gap-2.5">
        {/* House mark: peaked roof + side walls + bottom-left foot */}
        <svg
          width="34"
          height="34"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
          className="dtm-logo-mark shrink-0"
        >
          <path
            d="M5 34 V17 L20 5.5 L35 17 V34"
            stroke={stroke}
            strokeWidth="2.1"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M5 34 H13"
            stroke={stroke}
            strokeWidth="2.1"
            strokeLinecap="square"
          />
        </svg>

        {/* Wordmark + descriptor */}
        <span className="flex flex-col leading-none">
          <span className="dtm-wordmark font-sans font-bold tracking-[-0.02em]">
            DTM
          </span>
          {withDescriptor && (
            <span
              className="mt-[3px] font-mono"
              style={{
                color: descColor,
                fontSize: "0.5rem",
                letterSpacing: "0.24em",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              Дім твоєї мрії
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
