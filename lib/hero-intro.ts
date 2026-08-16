/**
 * Once-per-entrance Hero intro session.
 *
 * Survives React Strict Mode remounts the same way the page loader does:
 * module memory keeps the start timestamp so CSS can resume with a negative
 * animation-delay instead of replaying from frame 0.
 */

export const HERO_INTRO_MS = 2200;

export type HeroIntroPhase = "pending" | "play" | "done";

type Snapshot = { phase: HeroIntroPhase; elapsed: number };

const PENDING: Snapshot = { phase: "pending", elapsed: 0 };
const DONE: Snapshot = { phase: "done", elapsed: HERO_INTRO_MS };

const listeners = new Set<() => void>();

let startedAt = 0;
let finished = false;
let doneTimer = 0;
let playSnap: Snapshot = { phase: "play", elapsed: 0 };

function emit() {
  listeners.forEach((listener) => listener());
}

function snapshot(): Snapshot {
  if (finished) return DONE;
  if (!startedAt) return PENDING;
  return playSnap;
}

export function subscribeHeroIntro(listener: () => void) {
  if (startedAt && !finished) {
    playSnap = { phase: "play", elapsed: Date.now() - startedAt };
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getHeroIntroSnapshot() {
  return snapshot();
}

export function getServerHeroIntroSnapshot(): Snapshot {
  return PENDING;
}

export function beginHeroIntro() {
  if (finished || startedAt) return snapshot();
  startedAt = Date.now();
  playSnap = { phase: "play", elapsed: 0 };
  doneTimer = window.setTimeout(() => {
    finished = true;
    emit();
  }, HERO_INTRO_MS);
  emit();
  return snapshot();
}

export function finishHeroIntro() {
  if (finished) return;
  finished = true;
  if (doneTimer) {
    window.clearTimeout(doneTimer);
    doneTimer = 0;
  }
  emit();
}
