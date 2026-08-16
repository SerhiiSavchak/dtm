/**
 * Module-level boot session for the global first-paint loader.
 *
 * React Strict Mode remounts client trees in development; component state and
 * CSS animations would restart if this lived in useState/useEffect alone.
 * Module memory survives remounts but resets on a real hard navigation.
 */

export type LoaderPhase = "in" | "out" | "gone";

const listeners = new Set<() => void>();

let phase: LoaderPhase = "in";
let startedAt = 0;
let dismissScheduled = false;
let complete = false;
let criticalReady = false;
let fadeTimer = 0;
let goneTimer = 0;
let safetyTimer = 0;

const MIN_VISIBLE_MS = 420;
const FADE_MS = 400;
const SAFETY_MS = 2800;

function emit() {
  listeners.forEach((listener) => listener());
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearAllTimers() {
  window.clearTimeout(fadeTimer);
  window.clearTimeout(goneTimer);
  window.clearTimeout(safetyTimer);
  fadeTimer = 0;
  goneTimer = 0;
  safetyTimer = 0;
}

function finishGone() {
  if (complete) return;
  complete = true;
  clearAllTimers();
  phase = "gone";
  emit();
}

function beginFade() {
  if (complete) return;
  phase = "out";
  emit();
  if (reducedMotion()) {
    finishGone();
    return;
  }
  goneTimer = window.setTimeout(finishGone, FADE_MS);
}

function scheduleDismiss() {
  if (complete || dismissScheduled) return;
  dismissScheduled = true;
  window.clearTimeout(safetyTimer);

  const wait = reducedMotion()
    ? 0
    : Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt));

  fadeTimer = window.setTimeout(beginFade, wait);
}

export function subscribeLoader(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLoaderPhase(): LoaderPhase {
  return phase;
}

export function getServerLoaderPhase(): LoaderPhase {
  return "in";
}

export function isBootComplete() {
  return complete;
}

export function getLoaderElapsedMs() {
  if (!startedAt) return 0;
  return Date.now() - startedAt;
}

/** Idempotent. Call once from the loader mount. */
export function startLoaderSession() {
  if (complete || startedAt) return;
  startedAt = Date.now();
  safetyTimer = window.setTimeout(() => {
    criticalReady = true;
    scheduleDismiss();
  }, SAFETY_MS);
}

/**
 * Signal that the critical above-the-fold still (Hero poster) can paint.
 * Does not wait for below-the-fold images or the Hero video.
 */
export function markCriticalReady() {
  if (criticalReady) return;
  criticalReady = true;
  if (!startedAt) startLoaderSession();
  scheduleDismiss();
}
