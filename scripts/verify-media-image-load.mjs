import {
  buildSanityDirectUrl,
  directFallbackUrl,
  isSanityCdnImage,
  nextLoadAttempt,
} from "../lib/media/image-load.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

assert("Sanity CDN detected", isSanityCdnImage("https://cdn.sanity.io/images/x/y/a.jpg"));
assert("local path not Sanity", !isSanityCdnImage("/images/foo.jpg"));

const sanity =
  "https://cdn.sanity.io/images/l1d717lp/development/abc-720x1280.jpg";
const direct = buildSanityDirectUrl(sanity, 1080, 90);
assert("direct URL has w=", direct.includes("w=1080"));
assert("direct URL has q=", direct.includes("q=90"));
assert("direct URL auto format", direct.includes("auto=format"));

assert(
  "optimized → retry",
  nextLoadAttempt("optimized", true) === "retry"
);
assert(
  "retry → direct when Sanity",
  nextLoadAttempt("retry", true) === "direct"
);
assert(
  "retry → failed without direct",
  nextLoadAttempt("retry", false) === "failed"
);
assert(
  "direct → failed",
  nextLoadAttempt("direct", true) === "failed"
);

const fallback = directFallbackUrl(sanity, "100vw", 85, 390);
assert("fallback for Sanity", fallback?.includes("cdn.sanity.io"));
assert("fallback sized", fallback?.includes("w="));

const localFallback = directFallbackUrl("/images/hero-poster.jpg", "100vw", 85);
assert("local fallback path", localFallback === "/images/hero-poster.jpg");

if (failures.length) {
  console.error("media image load checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("media image load checks passed");
