import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_TELEGRAM_URL } from "../lib/leads/labels.ts";
import { socialLinks } from "../data/media.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

const CLIENT_URL = "https://t.me/+380931230505";
const bannedUsername = "xray" + "boy";

assert("canonical URL is client phone deep-link", PUBLIC_TELEGRAM_URL === CLIENT_URL);
assert("canonical URL is https t.me", PUBLIC_TELEGRAM_URL.startsWith("https://t.me/"));
assert("canonical URL uses +380 not 0-prefix", PUBLIC_TELEGRAM_URL === "https://t.me/+380931230505");
assert(
  "socialLinks.telegram uses canonical default (no env override in this check)",
  !process.env.NEXT_PUBLIC_TELEGRAM_URL
    ? socialLinks.telegram === CLIENT_URL
    : socialLinks.telegram === process.env.NEXT_PUBLIC_TELEGRAM_URL
);

const labels = readFileSync(join(root, "lib/leads/labels.ts"), "utf8");
assert("labels export PUBLIC_TELEGRAM_URL", labels.includes("export const PUBLIC_TELEGRAM_URL"));
assert("labels do not keep username constructor", !labels.includes("PUBLIC_TELEGRAM_USERNAME"));
assert("labels do not keep banned username", !labels.includes(bannedUsername));

const media = readFileSync(join(root, "data/media.ts"), "utf8");
assert("media imports PUBLIC_TELEGRAM_URL", media.includes("PUBLIC_TELEGRAM_URL"));
assert(
  "media telegram falls back to PUBLIC_TELEGRAM_URL",
  media.includes("process.env.NEXT_PUBLIC_TELEGRAM_URL || PUBLIC_TELEGRAM_URL")
);

const footer = readFileSync(join(root, "components/site-footer.tsx"), "utf8");
assert("footer Telegram CTAs use socialLinks.telegram", footer.includes("socialLinks.telegram"));
assert("footer has no hardcoded t.me", !footer.includes("t.me/"));

const calc = readFileSync(join(root, "components/calculator/estimate-calculator.tsx"), "utf8");
assert("calculator Telegram CTA uses socialLinks.telegram", calc.includes("socialLinks.telegram"));
assert("calculator has no hardcoded t.me", !calc.includes("t.me/"));

const header = readFileSync(join(root, "components/site-header.tsx"), "utf8");
assert("header has no t.me", !header.includes("t.me/"));
assert("header has no telegram href", !header.includes("socialLinks.telegram"));

const telegramBot = readFileSync(join(root, "lib/leads/telegram.ts"), "utf8");
assert("lead bot still uses TELEGRAM_BOT_TOKEN", telegramBot.includes("TELEGRAM_BOT_TOKEN"));
assert("lead bot still uses TELEGRAM_PRIMARY_CHAT_ID", telegramBot.includes("TELEGRAM_PRIMARY_CHAT_ID"));
assert("lead bot still uses TELEGRAM_COPY_CHAT_IDS", telegramBot.includes("TELEGRAM_COPY_CHAT_IDS"));
assert("lead bot does not import public CTA URL", !telegramBot.includes("PUBLIC_TELEGRAM_URL"));
assert("lead bot does not link t.me contact", !telegramBot.includes("t.me/"));

const publicFiles = [
  "lib/leads/labels.ts",
  "data/media.ts",
  "components/site-footer.tsx",
  "components/site-header.tsx",
  "components/calculator/estimate-calculator.tsx",
  "lib/i18n/dictionaries.ts",
  "app/page.tsx",
];

for (const rel of publicFiles) {
  const text = readFileSync(join(root, rel), "utf8");
  assert(`${rel} has no banned username`, !text.includes(bannedUsername));
  assert(`${rel} has no t.me/093`, !text.includes("t.me/093"));
  assert(`${rel} has no telegram.me`, !text.toLowerCase().includes("telegram.me"));
  assert(`${rel} has no tg://`, !text.includes("tg://"));
}

if (failures.length) {
  console.error("public telegram checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("public telegram contact checks passed");
