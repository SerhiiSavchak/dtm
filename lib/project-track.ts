"use client";

import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Single owner: Embla translates the track. React state commits only on settle.
 * Snap pages are Embla’s measured points (trimSnaps handles the 3+4 pair).
 */
export function useProjectTrack(projectIds: readonly string[]) {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const options = useMemo<EmblaOptionsType>(
    () => ({
      align: "start",
      containScroll: "trimSnaps",
      skipSnaps: false,
      dragFree: false,
      loop: false,
      duration: reduced ? 0 : 22,
      slidesToScroll: 1,
      dragThreshold: 10,
      watchDrag: true,
      watchResize: true,
      watchSlides: false,
    }),
    [reduced]
  );

  const [viewportRef, emblaApi] = useEmblaCarousel(options);
  const apiRef = useRef<EmblaCarouselType | null>(null);
  const suppressClickRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const startLocationRef = useRef(0);
  const settleWatchRef = useRef(0);

  const [snapIndex, setSnapIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(projectIds.length > 1);

  const commit = useCallback((api: EmblaCarouselType) => {
    setSnapIndex(api.selectedScrollSnap());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  const setDraggingAttr = useCallback((on: boolean) => {
    const root = apiRef.current?.rootNode();
    if (!root) return;
    if (on) root.setAttribute("data-dragging", "true");
    else root.removeAttribute("data-dragging");
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    apiRef.current = emblaApi;
    const frame = window.requestAnimationFrame(() => {
      commit(emblaApi);
    });

    const finishGesture = (api: EmblaCarouselType) => {
      pointerActiveRef.current = false;
      setDraggingAttr(false);
      window.clearTimeout(settleWatchRef.current);
      settleWatchRef.current = window.setTimeout(() => {
        setDraggingAttr(false);
        commit(api);
      }, 420);
    };

    const onPointerDown = (api: EmblaCarouselType) => {
      pointerActiveRef.current = true;
      suppressClickRef.current = false;
      startLocationRef.current = api.internalEngine().offsetLocation.get();
      window.clearTimeout(settleWatchRef.current);
    };

    const onScroll = (api: EmblaCarouselType) => {
      if (!pointerActiveRef.current) return;
      if (Math.abs(api.internalEngine().offsetLocation.get() - startLocationRef.current) > 8) {
        suppressClickRef.current = true;
        setDraggingAttr(true);
      }
    };

    const onPointerUp = (api: EmblaCarouselType) => {
      finishGesture(api);
    };

    const onSelect = (api: EmblaCarouselType) => {
      if (pointerActiveRef.current) return;
      commit(api);
    };

    const onSettle = (api: EmblaCarouselType) => {
      pointerActiveRef.current = false;
      window.clearTimeout(settleWatchRef.current);
      setDraggingAttr(false);
      commit(api);
    };

    const onClickCapture = (event: Event) => {
      if (!suppressClickRef.current) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const releaseDrag = () => {
      const api = apiRef.current;
      pointerActiveRef.current = false;
      setDraggingAttr(false);
      if (api?.internalEngine().dragHandler.pointerDown()) {
        document.dispatchEvent(
          new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window })
        );
      }
    };

    emblaApi
      .on("pointerDown", onPointerDown)
      .on("scroll", onScroll)
      .on("pointerUp", onPointerUp)
      .on("select", onSelect)
      .on("settle", onSettle)
      .on("reInit", commit);

    const root = emblaApi.rootNode();
    root.addEventListener("click", onClickCapture, true);
    root.addEventListener("dragend", releaseDrag);
    window.addEventListener("blur", releaseDrag);
    root.addEventListener("pointercancel", releaseDrag);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleWatchRef.current);
      emblaApi
        .off("pointerDown", onPointerDown)
        .off("scroll", onScroll)
        .off("pointerUp", onPointerUp)
        .off("select", onSelect)
        .off("settle", onSettle)
        .off("reInit", commit);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("dragend", releaseDrag);
      window.removeEventListener("blur", releaseDrag);
      root.removeEventListener("pointercancel", releaseDrag);
      root.removeAttribute("data-dragging");
      apiRef.current = null;
    };
  }, [emblaApi, commit, setDraggingAttr]);

  const moveBy = useCallback((delta: number) => {
    const api = apiRef.current;
    if (!api) return;
    if (delta > 0) api.scrollNext();
    else if (delta < 0) api.scrollPrev();
  }, []);

  const onSlideClick = useCallback((fn: () => void) => {
    if (suppressClickRef.current) return;
    fn();
  }, []);

  const activeProjectIndex = Math.min(snapIndex, Math.max(0, projectIds.length - 1));

  return {
    viewportRef,
    activeProjectId: projectIds[activeProjectIndex] ?? projectIds[0] ?? "",
    activeProjectIndex,
    selectedSnapIndex: snapIndex,
    moveBy,
    canPrev,
    canNext,
    onSlideClick,
  };
}
