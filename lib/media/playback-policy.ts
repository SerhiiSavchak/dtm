/**
 * In-progress video playback / loading policy.
 * Desktop may autoplay all visible panels; mobile loads and plays one active panel.
 */

const MOBILE_MQ = "(max-width: 767px)";

export function isMobilePlaybackProfile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

export function prefersSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn =
    (
      navigator as Navigator & {
        connection?: { saveData?: boolean };
        mozConnection?: { saveData?: boolean };
        webkitConnection?: { saveData?: boolean };
      }
    ).connection ??
    (navigator as Navigator & { mozConnection?: { saveData?: boolean } })
      .mozConnection ??
    (navigator as Navigator & { webkitConnection?: { saveData?: boolean } })
      .webkitConnection;
  return Boolean(conn?.saveData);
}

export type InProgressPlaybackContext = {
  boardInView: boolean;
  boardNearView: boolean;
  panelIndex: number;
  activeIndex: number;
  reducedMotion: boolean;
  viewerOpen: boolean;
  saveData: boolean;
  /** Section intro past boot/armed — panels are animating or interactive. */
  mediaLive: boolean;
};

/** Whether this panel's <video> should fetch media (source mounted). */
export function shouldLoadInProgressVideoForProfile(
  ctx: InProgressPlaybackContext,
  mobile: boolean
): boolean {
  if (!ctx.boardNearView || ctx.saveData || ctx.reducedMotion) return false;
  if (!ctx.mediaLive && !ctx.boardInView) return false;
  if (mobile) {
    return ctx.panelIndex === ctx.activeIndex;
  }
  return ctx.boardNearView;
}

export function shouldLoadInProgressVideo(ctx: InProgressPlaybackContext): boolean {
  return shouldLoadInProgressVideoForProfile(ctx, isMobilePlaybackProfile());
}

/** Whether this panel should attempt muted autoplay. */
export function shouldAutoplayInProgressPanelForProfile(
  ctx: InProgressPlaybackContext,
  mobile: boolean
): boolean {
  if (!ctx.boardInView || ctx.reducedMotion || ctx.viewerOpen || ctx.saveData) {
    return false;
  }
  if (!ctx.mediaLive) return false;
  if (mobile) {
    return ctx.panelIndex === ctx.activeIndex;
  }
  return true;
}

export function shouldAutoplayInProgressPanel(
  ctx: InProgressPlaybackContext
): boolean {
  return shouldAutoplayInProgressPanelForProfile(ctx, isMobilePlaybackProfile());
}

/** Poster fetch priority: first panel when section approaches viewport. */
export function inProgressPosterPriority(
  panelIndex: number,
  boardNearView: boolean
): boolean {
  return boardNearView && panelIndex === 0;
}
