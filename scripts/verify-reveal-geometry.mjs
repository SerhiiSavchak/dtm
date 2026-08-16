import {
  shouldEnterReveal,
  shouldResetReveal,
  ENTER_TOP_DESKTOP,
  ENTER_TOP_MOBILE,
} from "../components/fx/reveal-geometry.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

function box(top, height, width = 320) {
  return { top, bottom: top + height, height, width };
}

const vh = 800;

// Far below-the-fold must not enter on first paint (the original site bug).
assert(
  "far BTF (top 2400) does not enter",
  shouldEnterReveal(box(2400, 400), vh) === false
);
assert(
  "just under the fold (top = vh) does not enter",
  shouldEnterReveal(box(vh, 400), vh) === false
);
assert(
  "1px peek at the bottom does not enter",
  shouldEnterReveal(box(vh - 1, 80), vh) === false
);
assert(
  "80px under-fold band (old rootMargin) does not enter",
  shouldEnterReveal(box(vh - 40, 200), vh) === false
);

// Enter when the top crosses ~82vh with a meaningful visible span.
assert(
  "section top at 80vh enters on desktop",
  shouldEnterReveal(box(vh * 0.8, 420), vh) === true
);
assert(
  "section top at 87vh does not enter on desktop",
  shouldEnterReveal(box(vh * 0.87, 420), vh) === false
);
assert(
  `desktop gate is ${ENTER_TOP_DESKTOP}`,
  ENTER_TOP_DESKTOP >= 0.78 && ENTER_TOP_DESKTOP <= 0.85
);

// Tall section: do not require 25% of a 200vh box.
assert(
  "tall section enters when its top crosses the gate",
  shouldEnterReveal(box(vh * 0.8, vh * 2.4), vh) === true
);

// Small label still needs more than a sliver.
assert(
  "tiny 8px sliver does not enter",
  shouldEnterReveal(box(vh * 0.5, 8), vh) === false
);
assert(
  "eyebrow in the upper viewport enters",
  shouldEnterReveal(box(vh * 0.55, 24), vh) === true
);

// Mobile uses a later top gate so fast swipe is not left with hidden copy.
assert(
  "mobile 86vh does not enter on desktop",
  shouldEnterReveal(box(vh * 0.86, 300), vh, { mobile: false }) === false
);
assert(
  "mobile 86vh enters on small screens",
  shouldEnterReveal(box(vh * 0.86, 300), vh, { mobile: true }) === true
);
assert("mobile gate is 0.9", ENTER_TOP_MOBILE === 0.9);

// Hard refresh mid-page: in-view box must enter.
assert(
  "mid-page in-view heading enters",
  shouldEnterReveal(box(120, 280), vh) === true
);

// Hysteresis: stay completed while still on screen; reset only past buffer.
assert(
  "partially scrolled-up section does not reset",
  shouldResetReveal(box(-80, 500), vh) === false
);
assert(
  "fully above plus 80px buffer resets",
  shouldResetReveal(box(-400, 200), vh) === true
);
assert(
  "fully below plus 80px buffer resets",
  shouldResetReveal(box(vh + 200, 300), vh) === true
);
assert(
  "still intersecting the viewport does not reset",
  shouldResetReveal(box(200, 400), vh) === false
);

if (failures.length) {
  console.error("reveal geometry failures:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("reveal geometry ok");
