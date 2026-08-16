export type LeadClientSession = {
  submissionId: string;
  formStartedAt: number;
};

export function createLeadSession(now = Date.now()): LeadClientSession {
  return {
    submissionId: crypto.randomUUID(),
    formStartedAt: now,
  };
}

/** Reuse the current session for retries; create only if missing. */
export function ensureLeadSession(
  current: LeadClientSession | null,
  now = Date.now()
): LeadClientSession {
  return current ?? createLeadSession(now);
}

export type LeadSubmitGuards = {
  submitLock: boolean;
  hasSubmitted: boolean;
  navLock: boolean;
  phase: "form" | "submitting" | "success" | "error";
};

export function canSubmitLead(guards: LeadSubmitGuards): boolean {
  if (guards.submitLock || guards.hasSubmitted) return false;
  if (guards.navLock) return false;
  if (guards.phase === "submitting" || guards.phase === "success") return false;
  return true;
}

/**
 * Intentional restart after a confirmed success (or an explicit UI reset).
 * Replaces submissionId and formStartedAt; clears already-submitted guards.
 */
export function restartLeadSession(now = Date.now()): {
  session: LeadClientSession;
  submitLock: boolean;
  hasSubmitted: boolean;
  navLock: boolean;
} {
  return {
    session: createLeadSession(now),
    submitLock: false,
    hasSubmitted: false,
    navLock: false,
  };
}
