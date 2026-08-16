/**
 * In-memory idempotency keyed by submissionId for a single Node process.
 * On serverless (Vercel) each isolate has its own Map — retries that land on a
 * different instance are not coalesced. That is not a global “one lead forever”
 * lock; it only dedupes same-ID retries on the same instance.
 */
export class SubmissionIdempotency<T> {
  private readonly done = new Map<string, { at: number; body: T }>();
  private readonly inflight = new Map<string, Promise<T>>();
  private readonly windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  prune(now = Date.now()) {
    const cutoff = now - this.windowMs;
    for (const [key, value] of this.done) {
      if (value.at < cutoff) this.done.delete(key);
    }
  }

  getDone(id: string, now = Date.now()): T | undefined {
    this.prune(now);
    const entry = this.done.get(id);
    if (!entry) return undefined;
    if (now - entry.at >= this.windowMs) {
      this.done.delete(id);
      return undefined;
    }
    return entry.body;
  }

  getInflight(id: string): Promise<T> | undefined {
    return this.inflight.get(id);
  }

  setInflight(id: string, promise: Promise<T>) {
    this.inflight.set(id, promise);
  }

  succeed(id: string, body: T, now = Date.now()) {
    this.inflight.delete(id);
    this.done.set(id, { at: now, body });
    this.prune(now);
  }

  /** First attempt never confirmed a delivery — allow a retry of the same ID. */
  fail(id: string) {
    this.inflight.delete(id);
  }
}
