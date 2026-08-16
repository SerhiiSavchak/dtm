/** Static SVG grain. Almost imperceptible; CSS lowers it over media. */
export function SubtleGrain() {
  return (
    <svg
      className="arch-grain"
      aria-hidden
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter
        id="dtm-grain"
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.72"
          numOctaves="4"
          stitchTiles="stitch"
          result="n"
        />
        <feColorMatrix type="saturate" values="0" in="n" result="g" />
      </filter>
      <rect width="100%" height="100%" filter="url(#dtm-grain)" />
    </svg>
  );
}
