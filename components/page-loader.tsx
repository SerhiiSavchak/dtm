"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Logo } from "./logo";
import {
  getLoaderElapsedMs,
  getLoaderPhase,
  getServerLoaderPhase,
  isBootComplete,
  startLoaderSession,
  subscribeLoader,
} from "@/lib/boot-session";

/**
 * Single global first-paint overlay. Session state lives in lib/boot-session
 * so Strict Mode remounts cannot restart the sequence.
 */
export function PageLoader({ onDone }: { onDone?: () => void }) {
  const phase = useSyncExternalStore(
    subscribeLoader,
    getLoaderPhase,
    getServerLoaderPhase
  );
  const onDoneRef = useRef(onDone);
  const signaled = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    startLoaderSession();
  }, []);

  useEffect(() => {
    if (phase !== "out" && phase !== "gone") return;
    if (signaled.current) return;
    signaled.current = true;
    onDoneRef.current?.();
  }, [phase]);

  useEffect(() => {
    if (!isBootComplete()) return;
    if (signaled.current) return;
    signaled.current = true;
    onDoneRef.current?.();
  }, []);

  if (phase === "gone") return null;

  const elapsed = getLoaderElapsedMs();

  return (
    <div
      className={`page-loader fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-deep ${
        phase === "out" ? "page-loader-out" : ""
      }`}
      aria-hidden="true"
    >
      <Logo tone="paper" withDescriptor />
      <div
        className="page-loader-line mt-8"
        style={{ animationDelay: `-${elapsed}ms` }}
      />
    </div>
  );
}
