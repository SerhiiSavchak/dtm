"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  shouldEnterReveal,
  shouldResetReveal,
  type RevealBox,
} from "./reveal-geometry";

export type RevealPolicy = "load-once" | "reveal-once" | "reveal-reversible";
export type RevealCycle = "first" | "again";
export type ScrollDir = "down" | "up";

export type RevealMotion = {
  inView: boolean;
  cycle: RevealCycle;
  direction: ScrollDir;
  policy: RevealPolicy;
  armed: boolean;
};

export const RevealMotionContext = createContext<RevealMotion | null>(null);

export function useRevealMotion() {
  return useContext(RevealMotionContext);
}

export function revealStateClass(inView: boolean, armed: boolean) {
  return `${armed ? "is-armed" : ""} ${inView ? "is-in" : ""}`.trim();
}

type InViewOptions = {
  policy?: RevealPolicy;
  enabled?: boolean;
  /** @deprecated Shared geometry owns the trigger. Kept so callers type-check. */
  threshold?: number;
  /** @deprecated Shared geometry owns the trigger. Kept so callers type-check. */
  rootMargin?: string;
};

type MotionSnap = {
  inView: boolean;
  cycle: RevealCycle;
  direction: ScrollDir;
  armed: boolean;
};

type TargetRecord = {
  policy: RevealPolicy;
  enteredOnce: boolean;
  visible: boolean;
  armed: boolean;
  set: (next: MotionSnap) => void;
};

const targets = new Map<Element, TargetRecord>();

let pool: IntersectionObserver | null = null;
let scrollDir: ScrollDir = "down";
let lastScrollY = 0;
let dirFrame = 0;
let globalsBound = false;
let documentArmed = false;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobile() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function readBox(node: HTMLElement): RevealBox {
  const rect = node.getBoundingClientRect();
  if (rect.width >= 0.5 && rect.height >= 0.5) {
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      width: rect.width,
    };
  }
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  if (width < 0.5 && height < 0.5) {
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: 0,
      width: 0,
    };
  }
  return {
    top: rect.top,
    bottom: rect.top + height,
    height,
    width,
  };
}

function armDocumentMotion() {
  if (documentArmed || typeof document === "undefined") return;
  if (reducedMotion()) {
    document.documentElement.setAttribute("data-motion", "reduce");
    documentArmed = true;
    return;
  }
  document.documentElement.setAttribute("data-motion", "ok");
  documentArmed = true;
}

function scheduleArmDocument() {
  if (documentArmed) return;
  window.requestAnimationFrame(() => {
    armDocumentMotion();
  });
}

function getPool() {
  if (pool) return pool;
  pool = new IntersectionObserver(onPoolEntries, {
    // Wide band so leave-buffer still notifies. Enter/reset use geometry.
    // Scroll also re-evaluates — IO ratio can sit at 1 while the box is
    // still below the 82vh gate, so callbacks alone are not enough.
    root: null,
    rootMargin: "180px 0px 180px 0px",
    threshold: [0, 0.04, 0.1, 0.15, 0.18, 0.25, 0.35, 0.5, 0.75, 1],
  });
  return pool;
}

function onPoolEntries(entries: IntersectionObserverEntry[]) {
  for (const entry of entries) evaluateNode(entry.target);
}

function pushSnap(rec: TargetRecord, next: MotionSnap) {
  rec.armed = next.armed;
  rec.set(next);
}

function evaluateNode(target: Element) {
  const rec = targets.get(target);
  if (!rec) return;
  const node = target as HTMLElement;
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  const box = readBox(node);

  if (reducedMotion()) {
    if (!rec.visible || !rec.armed) {
      rec.visible = true;
      rec.enteredOnce = true;
      pushSnap(rec, {
        inView: true,
        cycle: "first",
        direction: scrollDir,
        armed: true,
      });
    }
    return;
  }

  if (rec.visible) {
    if (rec.policy === "reveal-reversible" && shouldResetReveal(box, vh)) {
      rec.visible = false;
      pushSnap(rec, {
        inView: false,
        cycle: "again",
        direction: scrollDir,
        armed: true,
      });
    }
    return;
  }

  if (shouldEnterReveal(box, vh, { mobile: isMobile() })) {
    const cycle: RevealCycle = rec.enteredOnce ? "again" : "first";
    rec.enteredOnce = true;
    rec.visible = true;
    pushSnap(rec, { inView: true, cycle, direction: scrollDir, armed: true });
    return;
  }

  if (!rec.armed) {
    pushSnap(rec, {
      inView: false,
      cycle: rec.enteredOnce ? "again" : "first",
      direction: scrollDir,
      armed: true,
    });
  }
}

function syncAll() {
  targets.forEach((_, node) => evaluateNode(node));
}

function onScroll() {
  if (dirFrame) return;
  dirFrame = window.requestAnimationFrame(() => {
    dirFrame = 0;
    const y = window.scrollY || 0;
    if (y > lastScrollY + 1) scrollDir = "down";
    else if (y < lastScrollY - 1) scrollDir = "up";
    lastScrollY = y;
    syncAll();
  });
}

function onResize() {
  if (dirFrame) return;
  dirFrame = window.requestAnimationFrame(() => {
    dirFrame = 0;
    syncAll();
  });
}

function onVisible() {
  if (document.visibilityState === "visible") onResize();
}

function bindGlobals() {
  if (globalsBound || typeof window === "undefined") return;
  globalsBound = true;
  lastScrollY = window.scrollY || 0;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  window.addEventListener("pageshow", onResize);
  document.addEventListener("visibilitychange", onVisible);
}

function unbindGlobalsIfIdle() {
  if (targets.size > 0 || !globalsBound) return;
  globalsBound = false;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("orientationchange", onResize);
  window.removeEventListener("pageshow", onResize);
  document.removeEventListener("visibilitychange", onVisible);
  if (dirFrame) window.cancelAnimationFrame(dirFrame);
  dirFrame = 0;
  pool?.disconnect();
  pool = null;
}

function register(node: HTMLElement, rec: TargetRecord) {
  bindGlobals();
  targets.set(node, rec);
  getPool().observe(node);
  queueMicrotask(() => evaluateNode(node));
  scheduleArmDocument();
}

function unregister(node: HTMLElement) {
  pool?.unobserve(node);
  targets.delete(node);
  unbindGlobalsIfIdle();
}

/**
 * Pooled IntersectionObserver + geometry hysteresis.
 * SSR / no-JS stays visible. CSS may hide only after the controller arms
 * both html[data-motion="ok"] and .is-armed on the observed node.
 * Clip/transform must live on an INNER node — never the observed host.
 */
export function useInView<T extends HTMLElement>(options: InViewOptions = {}) {
  const { policy = "reveal-reversible", enabled = true } = options;
  const ref = useRef<T | null>(null);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const [snap, setSnap] = useState<MotionSnap>({
    inView: false,
    cycle: "first",
    direction: "down",
    armed: false,
  });

  useLayoutEffect(() => {
    if (!enabled) return;

    if (reduced) {
      document.documentElement.setAttribute("data-motion", "reduce");
      return;
    }

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => {
        setSnap({
          inView: true,
          cycle: "first",
          direction: "down",
          armed: true,
        });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const rec: TargetRecord = {
      policy,
      enteredOnce: false,
      visible: false,
      armed: false,
      set: (next) => {
        setSnap((prev) =>
          prev.inView === next.inView &&
          prev.cycle === next.cycle &&
          prev.direction === next.direction &&
          prev.armed === next.armed
            ? prev
            : next
        );
      },
    };

    try {
      register(node, rec);
    } catch {
      unregister(node);
      const frame = window.requestAnimationFrame(() => {
        setSnap({
          inView: true,
          cycle: "first",
          direction: "down",
          armed: true,
        });
      });
      return () => {
        window.cancelAnimationFrame(frame);
        unregister(node);
      };
    }

    return () => {
      unregister(node);
    };
  }, [enabled, policy, reduced]);

  return {
    ref,
    inView: reduced || snap.inView,
    cycle: snap.cycle,
    direction: snap.direction,
    armed: reduced || snap.armed,
  };
}
