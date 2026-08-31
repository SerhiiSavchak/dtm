import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

assert("section-edge token defined", /--section-edge:\s*calc\(var\(--section-space\)/m.test(css));
assert(
  "section-pad uses split-beat top/bottom",
  /\.section-pad\s*\{[^}]*padding-top:\s*calc\(var\(--section-edge\)/s.test(css) &&
    /\.section-pad\s*\{[^}]*padding-bottom:\s*var\(--section-edge\)/s.test(css)
);
assert(
  "about section opens with full beat",
  /#about\s+\.section-pad\s*\{[^}]*padding-top:\s*calc\(var\(--section-space\)/s.test(css)
);
assert(
  "faq section closes with full beat",
  /#faq\s+\.section-pad\s*\{[^}]*padding-bottom:\s*var\(--section-space\)/s.test(css)
);
assert(
  "section-pad-sm uses split top",
  /\.section-pad-sm\s*\{[^}]*padding-top:\s*calc\(var\(--section-edge\)/s.test(css)
);
assert(
  "section-head arch inset moved to pad",
  /\.section-head\s*\{[^}]*padding-top:\s*0/s.test(css)
);
assert("section-space token defined", /--section-space:\s*clamp\(/m.test(css));
assert(
  "faq last-child trims answer padding",
  /li:last-child\s+\.faq-answer/.test(css)
);

if (failures.length) {
  console.error("section spacing checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("section spacing checks passed");
