type LogoProps = {
  /** Show the Ukrainian descriptor under the integrated mark. */
  withDescriptor?: boolean;
  /** House outline + tagline color. DTM letters stay brand orange. */
  tone?: "ink" | "paper";
  className?: string;
};

/**
 * DTM lockup traced from the brand mark: an open house
 * (left wall, short floor, peaked roof) integrating with orange DTM.
 * Circular avatar frame is not part of the site lockup.
 */
export function Logo({
  withDescriptor = true,
  tone = "ink",
  className,
}: LogoProps) {
  const stroke = tone === "paper" ? "var(--paper)" : "var(--ink)";
  const tag = tone === "paper" ? "rgba(255,255,255,0.9)" : "var(--graphite)";

  return (
    <span className={className} aria-label="DTM — Дім Твоєї Мрії" role="img">
      <svg
        className={`dtm-lockup ${withDescriptor ? "is-full" : "is-compact"}`}
        viewBox={withDescriptor ? "0 0 122 116" : "0 0 122 94"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M19.2 86H7.2V52L46.5 10L85 52"
          stroke={stroke}
          strokeWidth="2.55"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit="2.2"
        />
        <g fill="#f26a1f">
          <path
            fillRule="evenodd"
            d="M25 57h11.8c11.6 0 14.2 6.2 14.2 14.5S48.4 86 36.8 86H25V57Zm5.25 5.35h6.7c6.9 0 8.7 4.05 8.7 9.15s-1.8 9.15-8.7 9.15h-6.7v-18.3Z"
          />
          <path d="M54 57h25v5.35H70.2V86h-6.4V62.35H54V57Z" />
          <path d="M84 86V57h6.15l9.35 20.4L108.7 57H115v29h-5.5V67.5L99.5 86 89.5 67.5V86H84Z" />
        </g>
        {withDescriptor ? (
          <text
            className="dtm-lockup-tagline"
            x="61"
            y="107.5"
            fill={tag}
            fontSize="11"
            fontWeight="500"
            letterSpacing="0.18em"
            textAnchor="middle"
            textLength="108"
            lengthAdjust="spacing"
          >
            ДІМ ТВОЄЇ МРІЇ
          </text>
        ) : null}
      </svg>
    </span>
  );
}
