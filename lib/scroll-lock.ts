/**
 * Nested scroll lock that compensates for scrollbar disappearance so
 * `position: fixed` chrome (header, menus) does not shift horizontally.
 */

const VAR = "--scrollbar-comp";

let lockCount = 0;

function scrollbarWidth() {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

export function lockScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    const width = scrollbarWidth();
    document.documentElement.style.setProperty(VAR, `${width}px`);
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = width ? `${width}px` : "";
  }
  lockCount += 1;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.documentElement.style.setProperty(VAR, "0px");
}
