"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const DRAG_THRESHOLD = 8;
const AXIS_RATIO = 1.15;
const FLICK_VELOCITY = 0.55;
const RUBBER = 0.28;
const MAX_STEP = 1;
const SETTLE_MS = 140;
const CLICK_GUARD_MS = 420;
/** Offsets closer than this are one snap page (final 3+4 pair on desktop). */
const SNAP_MERGE_RATIO = 0.18;

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  startScroll: number;
  startSnap: number;
  lastX: number;
  lastT: number;
  samples: { t: number; x: number }[];
  axis: "undecided" | "x" | "y";
  moved: boolean;
  captured: boolean;
};

/** Unique physical pages. Several projects may share the last page. */
type SnapModel = {
  offsets: number[];
  snapToProject: number[];
  projectToSnap: number[];
};

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function measureSnaps(track: HTMLElement, projectCount: number): SnapModel {
  const slides = [...track.querySelectorAll<HTMLElement>("[data-slide]")];
  const origin = track.getBoundingClientRect().left;
  const left = track.scrollLeft;
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  const merge = Math.max(64, track.clientWidth * SNAP_MERGE_RATIO);

  const reachable = slides.map((slide) =>
    clamp(left + slide.getBoundingClientRect().left - origin, 0, max)
  );

  const offsets: number[] = [];
  const snapToProject: number[] = [];
  const projectToSnap: number[] = [];

  reachable.forEach((pos, i) => {
    const last = offsets[offsets.length - 1];
    if (last == null || pos - last >= merge) {
      offsets.push(pos);
      snapToProject.push(i);
    }
    projectToSnap.push(Math.max(0, offsets.length - 1));
  });

  if (!offsets.length) {
    return {
      offsets: [0],
      snapToProject: [0],
      projectToSnap: Array.from({ length: Math.max(1, projectCount) }, () => 0),
    };
  }

  return { offsets, snapToProject, projectToSnap };
}

function nearestSnap(offsets: number[], scrollLeft: number) {
  let best = 0;
  let bestDist = Infinity;
  offsets.forEach((offset, i) => {
    const dist = Math.abs(offset - scrollLeft);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

function dragVelocity(drag: DragSession) {
  const samples = drag.samples;
  if (samples.length < 2) return 0;
  const newest = samples[samples.length - 1];
  let oldest = samples[0];
  for (const sample of samples) {
    if (newest.t - sample.t <= 80) {
      oldest = sample;
      break;
    }
  }
  const dt = newest.t - oldest.t;
  if (dt < 12) return 0;
  return (newest.x - oldest.x) / dt;
}

function targetSnapFromDrag(drag: DragSession, offsets: number[], clientWidth: number) {
  const dx = drag.lastX - drag.startX;
  const velocity = dragVelocity(drag);
  const next = offsets[drag.startSnap + 1];
  const prev = offsets[drag.startSnap - 1];
  const span =
    next != null
      ? next - offsets[drag.startSnap]
      : prev != null
        ? offsets[drag.startSnap] - prev
        : clientWidth * 0.5;
  const threshold = Math.max(48, Math.min(96, span * 0.16));

  if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(velocity) < FLICK_VELOCITY) {
    return drag.startSnap;
  }

  let step = 0;
  if (Math.abs(dx) > threshold) {
    step = dx < 0 ? 1 : -1;
  } else if (Math.abs(velocity) > FLICK_VELOCITY) {
    step = velocity < 0 ? 1 : -1;
  }

  return clamp(drag.startSnap + clamp(step, -MAX_STEP, MAX_STEP), 0, offsets.length - 1);
}

/**
 * Native overflow carousel. Snap pages are unique measured offsets; the
 * primary project is the snap-anchor (left) card, not “largest visible”.
 */
export function useProjectTrack(projectIds: readonly string[]) {
  const trackRef = useRef<HTMLDivElement>(null);
  const idsRef = useRef(projectIds);

  const [activeProjectId, setActiveProjectId] = useState(projectIds[0] ?? "");
  const [snapIndex, setSnapIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(Math.max(1, projectIds.length));
  const projectIdRef = useRef(activeProjectId);
  const snapRef = useRef(0);
  const dragRef = useRef<DragSession | null>(null);
  const frameRef = useRef(0);
  const pendingScrollRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const clickGuardRef = useRef(0);
  const intendedSnapRef = useRef<number | null>(null);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const reducedRef = useRef(reduced);

  useEffect(() => {
    idsRef.current = projectIds;
  }, [projectIds]);

  const commitSnap = useCallback((snap: number, model: SnapModel) => {
    const nextSnap = clamp(snap, 0, model.offsets.length - 1);
    const projectIndex = model.snapToProject[nextSnap] ?? 0;
    const id = idsRef.current[projectIndex] ?? idsRef.current[0] ?? "";
    snapRef.current = nextSnap;
    setSnapIndex(nextSnap);
    setSnapCount(model.offsets.length);
    if (projectIdRef.current === id) return;
    projectIdRef.current = id;
    setActiveProjectId(id);
  }, []);

  const goToSnap = useCallback(
    (snap: number) => {
      const track = trackRef.current;
      if (!track) return;
      const model = measureSnaps(track, idsRef.current.length);
      const nextSnap = clamp(snap, 0, model.offsets.length - 1);
      const left = model.offsets[nextSnap] ?? 0;
      commitSnap(nextSnap, model);
      intendedSnapRef.current = nextSnap;

      const delta = Math.abs(track.scrollLeft - left);
      const instant = reducedRef.current || delta < 1;
      if (instant) {
        track.classList.remove("is-snapping");
        intendedSnapRef.current = null;
        if (delta >= 0.5) track.scrollTo({ left, behavior: "auto" });
        return;
      }

      track.classList.add("is-snapping");
      track.scrollTo({ left, behavior: "smooth" });
    },
    [commitSnap]
  );

  const goToProject = useCallback(
    (projectId: string) => {
      const track = trackRef.current;
      const ids = idsRef.current;
      const projectIndex = Math.max(0, ids.indexOf(projectId));
      if (!track) {
        projectIdRef.current = ids[projectIndex] ?? "";
        setActiveProjectId(projectIdRef.current);
        return;
      }
      const model = measureSnaps(track, ids.length);
      goToSnap(model.projectToSnap[projectIndex] ?? 0);
    },
    [goToSnap]
  );

  const moveBy = useCallback(
    (delta: number) => {
      goToSnap(snapRef.current + delta);
    },
    [goToSnap]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    idsRef.current = projectIds;
    commitSnap(snapRef.current, measureSnaps(track, projectIds.length));

    const maxScroll = () =>
      Math.max(0, track.scrollWidth - track.clientWidth);

    const clearRubber = () => {
      track.style.removeProperty("--drag-rubber");
      track.classList.remove("is-overscroll");
    };

    const applyScroll = (left: number) => {
      pendingScrollRef.current = left;
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0;
        const value = pendingScrollRef.current;
        if (value == null) return;
        const edge = maxScroll();
        if (value < 0) {
          track.scrollLeft = 0;
          track.style.setProperty("--drag-rubber", `${value}px`);
          track.classList.add("is-overscroll");
          return;
        }
        if (value > edge) {
          track.scrollLeft = edge;
          track.style.setProperty("--drag-rubber", `${edge - value}px`);
          track.classList.add("is-overscroll");
          return;
        }
        clearRubber();
        track.scrollLeft = value;
      });
    };

    const flushFrame = () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      if (pendingScrollRef.current != null) {
        const value = pendingScrollRef.current;
        const edge = maxScroll();
        track.scrollLeft = clamp(value, 0, edge);
        pendingScrollRef.current = null;
      }
      clearRubber();
    };

    const settle = () => {
      if (dragRef.current) return;
      const model = measureSnaps(track, idsRef.current.length);
      const intended = intendedSnapRef.current;
      if (intended != null) {
        const targetLeft = model.offsets[intended] ?? 0;
        if (
          track.classList.contains("is-snapping") &&
          Math.abs(track.scrollLeft - targetLeft) > 2
        ) {
          return;
        }
        track.classList.remove("is-snapping");
        intendedSnapRef.current = null;
        commitSnap(intended, model);
        return;
      }

      track.classList.remove("is-snapping");
      commitSnap(nearestSnap(model.offsets, track.scrollLeft), model);
    };

    const endDrag = (pointerId?: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (pointerId != null && drag.pointerId !== pointerId) return;

      dragRef.current = null;
      flushFrame();

      if (drag.captured) {
        try {
          track.releasePointerCapture(drag.pointerId);
        } catch {
          /* already released */
        }
      }

      track.classList.remove("is-dragging");
      if (!drag.moved) {
        if (Math.abs(track.scrollLeft - drag.startScroll) > 0.5) {
          track.scrollTo({ left: drag.startScroll, behavior: "auto" });
        }
        return;
      }

      suppressClickRef.current = true;
      window.clearTimeout(clickGuardRef.current);
      clickGuardRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
      }, CLICK_GUARD_MS);

      const model = measureSnaps(track, idsRef.current.length);
      goToSnap(targetSnapFromDrag(drag, model.offsets, track.clientWidth));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      track.classList.remove("is-snapping");
      intendedSnapRef.current = null;
      pendingScrollRef.current = null;
      clearRubber();

      const session: DragSession = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScroll: track.scrollLeft,
        startSnap: snapRef.current,
        lastX: event.clientX,
        lastT: performance.now(),
        samples: [{ t: performance.now(), x: event.clientX }],
        axis: event.pointerType === "mouse" ? "x" : "undecided",
        moved: false,
        captured: false,
      };
      dragRef.current = session;

      if (event.pointerType === "mouse") {
        track.classList.add("is-dragging");
        try {
          track.setPointerCapture(event.pointerId);
          session.captured = true;
        } catch {
          /* capture optional */
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const now = performance.now();
      drag.lastX = event.clientX;
      drag.lastT = now;
      drag.samples.push({ t: now, x: event.clientX });
      while (drag.samples.length > 1 && now - drag.samples[0].t > 100) {
        drag.samples.shift();
      }

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (drag.axis === "undecided") {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_THRESHOLD) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) * AXIS_RATIO ? "x" : "y";
        if (drag.axis === "y") {
          dragRef.current = null;
          track.classList.remove("is-dragging");
          return;
        }
        track.classList.add("is-dragging");
        try {
          track.setPointerCapture(event.pointerId);
          drag.captured = true;
        } catch {
          /* capture optional on some targets */
        }
      }

      if (drag.axis !== "x") return;
      if (Math.abs(dx) > DRAG_THRESHOLD) drag.moved = true;
      if (drag.moved && event.cancelable) event.preventDefault();

      const raw = drag.startScroll - dx;
      const edge = maxScroll();
      let next = raw;
      if (raw < 0) next = raw * RUBBER;
      else if (raw > edge) next = edge + (raw - edge) * RUBBER;

      applyScroll(next);
    };

    const onPointerUp = (event: PointerEvent) => {
      endDrag(event.pointerId);
    };

    const onLostCapture = (event: PointerEvent) => {
      endDrag(event.pointerId);
    };

    const onBlur = () => {
      endDrag();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      window.clearTimeout(clickGuardRef.current);
    };

    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    let scrollSettle = 0;
    const onScroll = () => {
      if (dragRef.current) return;
      window.clearTimeout(scrollSettle);
      scrollSettle = window.setTimeout(settle, SETTLE_MS);
    };

    const onResize = () => {
      if (dragRef.current) return;
      const ids = idsRef.current;
      const model = measureSnaps(track, ids.length);
      const projectIndex = Math.max(0, ids.indexOf(projectIdRef.current));
      const snap = model.projectToSnap[projectIndex] ?? 0;
      intendedSnapRef.current = null;
      track.classList.remove("is-snapping");
      track.scrollTo({ left: model.offsets[snap] ?? 0, behavior: "auto" });
      commitSnap(snap, model);
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove, { passive: false });
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("lostpointercapture", onLostCapture);
    track.addEventListener("click", onClickCapture, true);
    track.addEventListener("dragstart", onDragStart);
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", settle);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", onResize);
    window.addEventListener("blur", onBlur);

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(track);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.clearTimeout(scrollSettle);
      window.clearTimeout(clickGuardRef.current);
      resizeObserver.disconnect();
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("lostpointercapture", onLostCapture);
      track.removeEventListener("click", onClickCapture, true);
      track.removeEventListener("dragstart", onDragStart);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", settle);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("blur", onBlur);
    };
  }, [commitSnap, goToSnap, projectIds]);

  const ids = projectIds;
  const activeIndex = Math.max(0, ids.indexOf(activeProjectId));

  return {
    trackRef,
    activeProjectId,
    activeProjectIndex: activeIndex,
    selectedSnapIndex: snapIndex,
    goToProject,
    moveBy,
    canPrev: snapIndex > 0,
    canNext: snapIndex < snapCount - 1,
  };
}
