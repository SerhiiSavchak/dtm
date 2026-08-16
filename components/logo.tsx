type LogoProps = {
  /** Show the Ukrainian descriptor under the integrated mark. */
  withDescriptor?: boolean;
  /** House outline + tagline color. DTM letters stay brand orange. */
  tone?: "ink" | "paper";
  className?: string;
};

/**
 * Integrated DTM lockup: a thin architectural house whose walls and roof
 * wrap the orange DTM wordmark. Not a generic icon placed beside type.
 */
export function Logo({
  withDescriptor = true,
  tone = "ink",
  className,
}: LogoProps) {
  const stroke = tone === "paper" ? "var(--paper)" : "var(--ink)";
  const tag = tone === "paper" ? "rgba(255,255,255,0.72)" : "var(--graphite)";

  return (
    <span
      className={className}
      aria-label="DTM — Дім Твоєї Мрії"
      role="img"
    >
      <svg
        className={`dtm-lockup ${withDescriptor ? "is-full" : "is-compact"}`}
        viewBox={withDescriptor ? "0 0 112 54" : "0 0 112 38"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M6 33.5 V15.2 L56 3.4 L106 15.2 V33.5"
          stroke={stroke}
          strokeWidth="1.65"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <path
          d="M6 33.5 H20"
          stroke={stroke}
          strokeWidth="1.65"
          strokeLinecap="square"
        />
        <text
          className="dtm-lockup-wordmark"
          x="56"
          y="29.8"
          textAnchor="middle"
          fill="#f26a1f"
          fontSize="18.5"
          fontWeight="700"
          letterSpacing="-0.04em"
        >
          DTM
        </text>
        {withDescriptor ? (
          <text
            className="dtm-lockup-tagline"
            x="56"
            y="48.5"
            fill={tag}
            fontSize="6"
            fontWeight="500"
            letterSpacing="0.18em"
            textAnchor="middle"
          >
            ДІМ ТВОЄЇ МРІЇ
          </text>
        ) : null}
      </svg>
    </span>
  );
}
