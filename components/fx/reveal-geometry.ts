/**
 * Viewport geometry for section reveals.
 *
 * Enter is NOT `IntersectionObserver.isIntersecting`. A 0-threshold observer
 * with a positive rootMargin treats a 1px sliver (or the 80px band under the
 * fold) as a hit, so below-the-fold blocks animate during first paint.
 *
 * Enter: ~0.18 of the visible span, or the box top crossing ~82vh (90vh on
 * small screens). Reset only after the box has fully left plus 80–160px.
 */

export type RevealBox = {
  top: number;
  bottom: number;
  height: number;
  width: number;
};

export const ENTER_TOP_DESKTOP = 0.82;
export const ENTER_TOP_MOBILE = 0.9;
export const ENTER_RATIO = 0.18;
export const ENTER_MIN_VISIBLE_PX = 16;
export const RESET_BUFFER_MIN = 80;
export const RESET_BUFFER_MAX = 160;

export function revealBuffer(vh: number) {
  return Math.min(RESET_BUFFER_MAX, Math.max(RESET_BUFFER_MIN, vh * 0.12));
}

export function shouldEnterReveal(
  box: RevealBox,
  vh: number,
  options: { mobile?: boolean } = {}
) {
  if (vh <= 0) return false;
  if (box.width < 0.5 && box.height < 0.5) return false;

  const visible = Math.min(box.bottom, vh) - Math.max(box.top, 0);
  if (visible < ENTER_MIN_VISIBLE_PX) return false;

  const topGate = options.mobile ? ENTER_TOP_MOBILE : ENTER_TOP_DESKTOP;
  if (box.top >= vh * topGate) return false;
  if (box.bottom <= vh * 0.06) return false;

  const span = Math.max(1, Math.min(box.height, vh));
  if (visible / span >= ENTER_RATIO) return true;
  return box.top < vh * topGate;
}

export function shouldResetReveal(box: RevealBox, vh: number) {
  const buffer = revealBuffer(vh);
  return box.bottom < -buffer || box.top > vh + buffer;
}
