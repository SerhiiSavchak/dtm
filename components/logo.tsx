type LogoProps = {
  /** Show the small "ДІМ ТВОЄЇ МРІЇ" descriptor line */
  withDescriptor?: boolean;
  /** Color of the DTM wordmark + descriptor (house mark stays orange) */
  tone?: "ink" | "paper";
  className?: string;
};

/**
 * DTM identity — recreated as a clean scalable vector from the supplied
 * reference: a minimal architectural house outline, the orange "DTM"
 * wordmark, and the "ДІМ ТВОЄЇ МРІЇ" descriptor.
 *
 * No gradients, glow, 3D or shadow treatments — flat and sharp at any size.
 */
export function Logo({
  withDescriptor = true,
  tone = "ink",
  className,
}: LogoProps) {
  const wordColor = tone === "paper" ? "var(--paper)" : "var(--ink)";
  const descColor = tone === "paper" ? "var(--stone)" : "var(--graphite)";

  return (
    <span
      className={className}
      aria-label="DTM — Дім Твоєї Мрії"
      role="img"
    >
      <span className="flex items-center gap-2.5">
        {/* House mark */}
        <svg
          width="30"
          height="30"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M4 18 L20 5 L36 18"
            stroke="var(--orange)"
            strokeWidth="2.4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M8 16 V35 H32 V16"
            stroke="var(--orange)"
            strokeWidth="2.4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M17 35 V25 H23 V35"
            stroke="var(--orange)"
            strokeWidth="2.4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>

        {/* Wordmark */}
        <span className="flex flex-col leading-none">
          <span
            className="font-sans font-extrabold tracking-tight"
            style={{ color: wordColor, fontSize: "1.35rem", lineHeight: 1 }}
          >
            DTM
          </span>
          {withDescriptor && (
            <span
              className="label mt-1"
              style={{
                color: descColor,
                fontSize: "0.5rem",
                letterSpacing: "0.22em",
                fontWeight: 600,
              }}
            >
              Дім Твоєї Мрії
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
