import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export const STAGE_CROSSFADE_MS = 180;
export const STAGE_LOADER_DELAY_MS = 150;

/**
 * Keeps the outgoing layer visible until the incoming media signals readiness.
 * Latest target key wins — stale load callbacks are ignored.
 */
export function useStageCrossfade<T>(
  target: T,
  keyOf: (item: T) => string,
  reduced: boolean
) {
  const [shown, setShown] = useState(target);
  const [incoming, setIncoming] = useState<T | null>(null);
  const [incomingOn, setIncomingOn] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const requestRef = useRef(keyOf(target));

  const targetKey = keyOf(target);
  const shownKey = keyOf(shown);
  const incomingKey = incoming ? keyOf(incoming) : null;

  useLayoutEffect(() => {
    requestRef.current = targetKey;
  }, [targetKey]);

  if (reduced) {
    if (shownKey !== targetKey || incoming) {
      setShown(target);
      setIncoming(null);
      setIncomingOn(false);
      setShowLoader(false);
    }
  } else if (shownKey !== targetKey && incomingKey !== targetKey) {
    setIncoming(target);
    setIncomingOn(false);
    setShowLoader(false);
  } else if (shownKey === targetKey && incoming) {
    setIncoming(null);
    setIncomingOn(false);
    setShowLoader(false);
  }

  useEffect(() => {
    if (!incoming || incomingOn || reduced) return;
    const wait = window.setTimeout(() => {
      if (requestRef.current === keyOf(incoming)) setShowLoader(true);
    }, STAGE_LOADER_DELAY_MS);
    return () => window.clearTimeout(wait);
  }, [incoming, incomingOn, reduced, keyOf]);

  useEffect(() => {
    if (!incomingOn || !incoming) return;
    const next = incoming;
    const nextKey = keyOf(next);
    const fade = window.setTimeout(() => {
      if (requestRef.current !== nextKey) return;
      setShown(next);
      setIncoming(null);
      setIncomingOn(false);
      setShowLoader(false);
    }, STAGE_CROSSFADE_MS);
    return () => window.clearTimeout(fade);
  }, [incoming, incomingOn, keyOf]);

  const onIncomingReady = useCallback(() => {
    if (!incoming) return;
    if (requestRef.current !== keyOf(incoming)) return;
    setShowLoader(false);
    setIncomingOn(true);
  }, [incoming, keyOf]);

  const onIncomingFail = useCallback(() => {
    if (!incoming) return;
    if (requestRef.current !== keyOf(incoming)) return;
    setIncoming(null);
    setIncomingOn(false);
    setShowLoader(false);
  }, [incoming, keyOf]);

  return {
    shown,
    incoming,
    incomingOn,
    showLoader,
    busy: Boolean(incoming && !incomingOn),
    onIncomingReady,
    onIncomingFail,
  };
}
