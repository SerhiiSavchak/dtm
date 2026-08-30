import { leadInputSchema } from "../lib/leads/schema.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

function validBase() {
  return {
    objectType: "apartment",
    area: 72,
    rooms: 2,
    renovationType: "turnkey",
    design: "no",
    condition: "newbuild",
    start: "1-3",
    name: "Тест",
    phone: "+380671234567",
    locale: "uk",
    submissionId: crypto.randomUUID(),
    formStartedAt: Date.now() - 10_000,
  };
}

assert("valid payload parses", leadInputSchema.safeParse(validBase()).success);
assert(
  "malformed enum rejected",
  !leadInputSchema.safeParse({ ...validBase(), objectType: "yacht" }).success
);
assert(
  "oversized name rejected",
  !leadInputSchema.safeParse({ ...validBase(), name: "x".repeat(120) }).success
);
assert(
  "invalid phone rejected",
  !leadInputSchema.safeParse({ ...validBase(), phone: "abc" }).success
);
assert(
  "commercial with rooms rejected",
  !leadInputSchema.safeParse({
    ...validBase(),
    objectType: "commercial",
    rooms: 2,
  }).success
);
assert(
  "html-like name still parses (sanitized downstream)",
  leadInputSchema.safeParse({
    ...validBase(),
    name: "<script>alert(1)</script>",
  }).success
);
assert(
  "extra fields stripped by zod object",
  leadInputSchema.safeParse({
    ...validBase(),
    admin: true,
    token: "steal-me",
  }).success
);

if (failures.length) {
  console.error("security red-team checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("security red-team checks passed");
