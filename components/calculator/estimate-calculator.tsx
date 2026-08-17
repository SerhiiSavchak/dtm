"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Logo } from "@/components/logo";
import { externalLinkProps, socialLinks } from "@/data/media";
import {
  formatCalculatorSummary,
  summaryCopyFromDict,
  applyEstimatePatch,
} from "@/lib/calculator/answers";
import { resolveCalculatorProgress } from "@/lib/calculator/progress";
import {
  initialEstimateState,
  type CalcStepId,
  type EstimateFormState,
  type ObjectType,
} from "@/lib/calculator/types";
import { assembleLeadRequest } from "@/lib/leads/assemble";
import {
  canSubmitLead,
  ensureLeadSession,
  restartLeadSession,
  type LeadClientSession,
} from "@/lib/leads/client-session";
import { validateStep, type StepErrorKey } from "@/lib/leads/format";
import { formatAreaDisplay, parseArea, sanitizeAreaInput } from "@/lib/leads/parse-area";
import { sanitizePhoneInput, normalizePhone } from "@/lib/leads/phone";
import { sanitizePersonName } from "@/lib/leads/schema";
import { leadInputSchema } from "@/lib/leads/schema";
import { sourcePageFromLocation, utmFromSearch } from "@/lib/leads/utm";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";

type Phase = "form" | "submitting" | "success" | "error";

type SuccessMeta = {
  leadId: string;
};

const TRANSITION_MS = 220;

/** Native click-focus scrolls the control into view; keep page scrollY still. */
function suppressMouseFocusScroll(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
}

function OptionButton({
  selected,
  onClick,
  children,
  id,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  id?: string;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <button
      type="button"
      id={id}
      role="radio"
      aria-checked={selected}
      onMouseDown={suppressMouseFocusScroll}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`w-full px-6 py-5 text-left type-body font-medium calc-option ${
        selected ? "is-selected" : ""
      }`}
    >
      {children}
    </button>
  );
}

function FieldFeedback({
  id,
  message,
}: {
  id: string;
  message: string | null;
}) {
  return (
    <p
      id={id}
      className="calc-feedback"
      role={message ? "alert" : undefined}
      aria-live="polite"
    >
      {message ? <span className="calc-feedback-msg">{message}</span> : null}
    </p>
  );
}

export function EstimateCalculator() {
  const dict = useDictionary().calculator;
  const { locale } = useLocale();
  const { theme } = useTheme();
  const formId = useId();

  const [state, setState] = useState<EstimateFormState>(initialEstimateState);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Partial<Record<string, string>>>(
    {}
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const [animToken, setAnimToken] = useState(0);
  const [success, setSuccess] = useState<SuccessMeta | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [statusLive, setStatusLive] = useState("");

  const sessionRef = useRef<LeadClientSession | null>(null);
  const submitLockRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const navLockRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const submitGenerationRef = useRef(0);
  const steppedRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const utmRef = useRef<ReturnType<typeof utmFromSearch>>(undefined);

  function currentSession(): LeadClientSession {
    sessionRef.current = ensureLeadSession(sessionRef.current);
    return sessionRef.current;
  }

  useEffect(() => {
    currentSession();
    utmRef.current = utmFromSearch(window.location.search);
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isComplete = phase === "success";
  const { steps, currentIndex, currentStep, totalSteps, progressPercent } =
    resolveCalculatorProgress(stepIndex, state.objectType, isComplete);
  const stepId = steps[currentIndex] ?? "objectType";

  function errorMessage(key: StepErrorKey): string {
    return dict.errors[key];
  }

  function patch(partial: Partial<EstimateFormState>) {
    setState((prev) => applyEstimatePatch(prev, partial));
    setError(null);
    const keys = Object.keys(partial);
    if (keys.length) {
      setFieldError((prev) => {
        const next = { ...prev };
        for (const key of keys) delete next[key];
        return next;
      });
    }
  }

  function goTo(index: number) {
    if (navLockRef.current) return;
    if (index === currentIndex) return;
    steppedRef.current = true;
    navLockRef.current = true;
    setDirection(index < currentIndex ? -1 : 1);
    setAnimToken((token) => token + 1);
    setStepIndex(index);
    setError(null);
    window.setTimeout(() => {
      navLockRef.current = false;
    }, TRANSITION_MS);
  }

  function validateCurrent(): boolean {
    const result = validateStep(stepId, state);
    if (result.ok) {
      setError(null);
      setFieldError({});
      return true;
    }
    const message = errorMessage(result.key);
    setError(message);
    if (result.field) {
      setFieldError({ [result.field]: message });
    }
    return false;
  }

  function focusFirstInvalid() {
    const invalid =
      stageRef.current?.querySelector<HTMLElement>("[aria-invalid='true']") ??
      stageRef.current?.querySelector<HTMLElement>("input, button[role='radio']");
    invalid?.focus({ preventScroll: true });
  }

  function handleNext() {
    if (phase !== "form" || navLockRef.current) return;
    if (!validateCurrent()) {
      focusFirstInvalid();
      return;
    }
    if (currentIndex < totalSteps - 1) goTo(currentIndex + 1);
  }

  function handleBack() {
    if (phase !== "form" || navLockRef.current) return;
    if (currentIndex > 0) goTo(currentIndex - 1);
  }

  function handleSkipRooms() {
    if (navLockRef.current) return;
    patch({ rooms: "" });
    if (currentIndex < totalSteps - 1) goTo(currentIndex + 1);
  }

  async function handleSubmit() {
    if (
      !canSubmitLead({
        submitLock: submitLockRef.current,
        hasSubmitted: hasSubmittedRef.current,
        navLock: navLockRef.current,
        phase,
      })
    ) {
      return;
    }
    if (!validateCurrent()) {
      focusFirstInvalid();
      return;
    }

    const session = currentSession();

    const payload = assembleLeadRequest({
      state,
      locale,
      submissionId: session.submissionId,
      formStartedAt: session.formStartedAt,
      honeypot,
      sourcePage:
        typeof window === "undefined"
          ? undefined
          : sourcePageFromLocation(window.location.pathname, window.location.search),
      utm: utmRef.current,
    });

    const parsed = leadInputSchema.safeParse(payload);
    if (!parsed.success) {
      const phoneIssue = parsed.error.issues.some((issue) =>
        issue.path.includes("phone")
      );
      const nameIssue = parsed.error.issues.some((issue) =>
        issue.path.includes("name")
      );
      if (nameIssue) {
        const message = errorMessage("name");
        setError(message);
        setFieldError({ name: message });
      } else if (phoneIssue) {
        const message = errorMessage("phoneInvalid");
        setError(message);
        setFieldError({ phone: message });
      } else {
        setError(dict.errors.submit);
      }
      focusFirstInvalid();
      return;
    }

    submitLockRef.current = true;
    const generation = submitGenerationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
    setPhase("submitting");
    setError(null);
    setStatusLive(dict.sending);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        leadId?: string;
        duplicate?: boolean;
        delivered?: { telegram?: boolean; email?: boolean };
      } | null;

      if (generation !== submitGenerationRef.current) return;

      const delivered =
        Boolean(data?.delivered?.telegram) || Boolean(data?.delivered?.email);

      if (!res.ok || !data?.ok || !data.leadId || !delivered) {
        setPhase("error");
        setError(dict.errors.submit);
        setStatusLive(dict.errors.submit);
        return;
      }

      hasSubmittedRef.current = true;
      setSuccess({ leadId: data.leadId });
      setPhase("success");
      setStatusLive(dict.success.title);
    } catch {
      if (generation !== submitGenerationRef.current) return;
      setPhase("error");
      setError(dict.errors.submit);
      setStatusLive(dict.errors.submit);
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) abortRef.current = null;
      if (generation === submitGenerationRef.current) {
        submitLockRef.current = false;
      }
    }
  }

  function reset() {
    submitGenerationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    const next = restartLeadSession();
    sessionRef.current = next.session;
    submitLockRef.current = next.submitLock;
    hasSubmittedRef.current = next.hasSubmitted;
    navLockRef.current = next.navLock;
    setState(initialEstimateState);
    setStepIndex(0);
    setPhase("form");
    setError(null);
    setFieldError({});
    setSuccess(null);
    setHoneypot("");
    setStatusLive("");
    setDirection(1);
    setAnimToken((token) => token + 1);
    steppedRef.current = false;
  }

  useEffect(() => {
    if (phase !== "form") return;
    if (!steppedRef.current) return;

    const heading = stageRef.current?.querySelector<HTMLElement>(
      ".calc-question, legend"
    );
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [stepId, animToken, phase]);

  useEffect(() => {
    if (phase === "error") {
      errorRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  const contextItems = formatCalculatorSummary(
    state,
    stepId,
    summaryCopyFromDict(dict)
  );

  const busy = phase === "submitting";

  return (
    <div className="calc-shell">
      <div className="sr-only" aria-live="polite">
        {statusLive}
      </div>

      <div className="calc-progress">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="label calc-muted">
            {dict.stepOf} {currentStep} / {totalSteps}
          </span>
          <span className="label text-accent">{progressPercent}%</span>
        </div>
        <div
          className="h-0.5 w-full calc-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label={dict.progress}
          style={{ ["--calc-p" as string]: String(progressPercent / 100) }}
        >
          <div className="h-0.5 calc-track-fill" />
        </div>
        <div className="calc-context" aria-live="polite">
          {contextItems.length ? (
            <ul className="calc-context-list">
              {contextItems.map((item) => (
                <li key={item.key} className="calc-context-item">
                  {item.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {phase === "success" && success ? (
        <SuccessPanel
          dict={dict}
          success={success}
          onReset={reset}
          logoTone={theme === "dark" ? "paper" : "ink"}
        />
      ) : (
        <form
          className="calc-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (stepId === "lead") void handleSubmit();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || stepId === "lead") return;
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (target.name === "website") return;
            event.preventDefault();
            handleNext();
          }}
        >
          <div
            ref={stageRef}
            className="calc-stage"
            data-direction={direction}
          >
            <div
              key={`${stepId}-${animToken}`}
              className={
                direction < 0 ? "calc-step-panel is-back" : "calc-step-panel"
              }
            >
              <StepBody
                stepId={stepId}
                state={state}
                patch={patch}
                formId={formId}
                fieldError={fieldError}
                onBlurField={(field, value) => {
                  if (field === "phone") {
                    if (!value.trim()) return;
                    if (!normalizePhone(value)) {
                      setFieldError((prev) => ({
                        ...prev,
                        phone: errorMessage("phoneInvalid"),
                      }));
                    }
                    return;
                  }
                  if (field === "name") {
                    if (!value.trim()) return;
                    if (!sanitizePersonName(value)) {
                      setFieldError((prev) => ({
                        ...prev,
                        name: errorMessage("name"),
                      }));
                    }
                    return;
                  }
                  if (field === "area" && value.trim()) {
                    const parsed = parseArea(value);
                    if (!parsed.ok) {
                      const key =
                        parsed.reason === "zero" ? "areaZero" : "areaDigits";
                      setFieldError((prev) => ({
                        ...prev,
                        area: errorMessage(key),
                      }));
                    }
                  }
                }}
                onSelectObject={(value) => {
                  patch({ objectType: value });
                }}
              />
            </div>
          </div>

          <p
            ref={errorRef}
            className="calc-feedback"
            tabIndex={-1}
            role={error && !fieldError.area && !fieldError.phone && !fieldError.name ? "alert" : undefined}
          >
            {error && !fieldError.area && !fieldError.phone && !fieldError.name ? (
              <span className="calc-feedback-msg">{error}</span>
            ) : null}
          </p>

          <div className="calc-nav">
            <button
              type="button"
              onMouseDown={suppressMouseFocusScroll}
              onClick={handleBack}
              disabled={currentIndex === 0 || busy}
              className="type-small calc-back"
            >
              ← {dict.back}
            </button>

            <div className="calc-nav-actions">
              {stepId === "rooms" ? (
                <button
                  type="button"
                  onMouseDown={suppressMouseFocusScroll}
                  onClick={handleSkipRooms}
                  disabled={busy}
                  className="btn btn-ghost"
                >
                  {dict.steps.rooms.skip}
                </button>
              ) : null}

              {stepId === "lead" ? (
                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary calc-submit"
                  aria-busy={busy}
                >
                  {busy ? dict.sending : phase === "error" ? dict.retry : dict.submit}
                  <span className="btn-arrow" aria-hidden>
                    →
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onMouseDown={suppressMouseFocusScroll}
                  onClick={handleNext}
                  disabled={busy}
                  className="btn btn-primary"
                >
                  {dict.next}
                  <span className="btn-arrow" aria-hidden>
                    →
                  </span>
                </button>
              )}
            </div>
          </div>

          {phase === "error" ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                {...externalLinkProps(socialLinks.telegram)}
                className="btn btn-ghost"
              >
                {dict.success.telegram}
              </a>
              <a {...externalLinkProps(socialLinks.phone)} className="btn btn-ghost">
                {dict.success.call}
              </a>
            </div>
          ) : null}

          <div className="calc-hp" hidden inert>
            <input
              id={`${formId}-website`}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </div>
        </form>
      )}
    </div>
  );
}

function SuccessPanel({
  dict,
  success,
  onReset,
  logoTone,
}: {
  dict: ReturnType<typeof useDictionary>["calculator"];
  success: SuccessMeta;
  onReset: () => void;
  logoTone: "ink" | "paper";
}) {
  return (
    <div className="calc-success" role="status">
      <Logo tone={logoTone} withDescriptor />
      <h3 className="mt-6 type-h2">{dict.success.title}</h3>
      <p className="calc-muted mt-3 type-body-lg">{dict.success.body}</p>
      <p className="mt-4 font-mono text-sm text-accent">
        {dict.success.leadId}: {success.leadId}
      </p>
      <div className="calc-success-actions">
        <button
          type="button"
          onClick={onReset}
          className="btn btn-primary"
        >
          {dict.success.again}
        </button>
      </div>
    </div>
  );
}

function StepBody({
  stepId,
  state,
  patch,
  formId,
  fieldError,
  onBlurField,
  onSelectObject,
}: {
  stepId: CalcStepId;
  state: EstimateFormState;
  patch: (partial: Partial<EstimateFormState>) => void;
  formId: string;
  fieldError: Partial<Record<string, string>>;
  onBlurField: (field: "area" | "name" | "phone", value: string) => void;
  onSelectObject: (value: ObjectType) => void;
}) {
  const t = useDictionary().calculator;
  const areaHintId = `${formId}-area-hint`;
  const areaErrorId = `${formId}-area-error`;
  const phoneHintId = `${formId}-phone-hint`;
  const phoneErrorId = `${formId}-phone-error`;
  const nameErrorId = `${formId}-name-error`;

  switch (stepId) {
    case "objectType":
      return (
        <fieldset>
          <legend className="calc-question">{t.steps.objectType.title}</legend>
          <div className="calc-choices grid gap-3" role="radiogroup" aria-label={t.steps.objectType.title}>
            {t.steps.objectType.options.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={state.objectType === opt.value}
                onClick={() => onSelectObject(opt.value as ObjectType)}
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </fieldset>
      );

    case "area":
      return (
        <div>
          <label htmlFor={`${formId}-area`} className="calc-question">
            {t.steps.area.title}
          </label>
          <p id={areaHintId} className="calc-hint calc-muted type-body-sm">
            {t.steps.area.hint}
          </p>
          <div className="calc-area">
            <input
              id={`${formId}-area`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={t.steps.area.placeholder}
              value={state.area}
              aria-invalid={fieldError.area ? true : undefined}
              aria-describedby={`${areaHintId} ${areaErrorId}`}
              onChange={(event) => patch({ area: sanitizeAreaInput(event.target.value) })}
              onBlur={() => {
                const parsed = parseArea(state.area);
                if (parsed.ok) patch({ area: formatAreaDisplay(parsed.value) });
                onBlurField("area", state.area);
              }}
              onWheel={(event) => event.currentTarget.blur()}
              className={`calc-field calc-area-input w-full bg-transparent text-4xl font-semibold tracking-tight outline-none md:text-5xl ${
                fieldError.area ? "is-invalid" : ""
              }`}
            />
            <span className="calc-area-suffix font-mono text-sm text-accent">
              {t.steps.area.unit}
            </span>
          </div>
          <FieldFeedback id={areaErrorId} message={fieldError.area ?? null} />
        </div>
      );

    case "rooms":
      return (
        <div>
          <p className="calc-question" id={`${formId}-rooms-label`}>
            {t.steps.rooms.title}
          </p>
          <p className="calc-hint calc-muted type-body-sm">{t.steps.rooms.hint}</p>
          <div
            className="calc-choices flex flex-wrap gap-3"
            role="radiogroup"
            aria-labelledby={`${formId}-rooms-label`}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={state.rooms === String(n)}
                onMouseDown={suppressMouseFocusScroll}
                onClick={() => patch({ rooms: String(n) })}
                className={`min-h-14 min-w-14 px-4 py-3 text-lg font-medium calc-option ${
                  state.rooms === String(n) ? "is-selected" : ""
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      );

    case "renovationType":
      return (
        <fieldset>
          <legend className="calc-question">{t.steps.renovationType.title}</legend>
          <div className="calc-choices grid gap-3" role="radiogroup">
            {t.steps.renovationType.options.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={state.renovationType === opt.value}
                onClick={() =>
                  patch({
                    renovationType: opt.value as EstimateFormState["renovationType"],
                  })
                }
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </fieldset>
      );

    case "design":
      return (
        <fieldset>
          <legend className="calc-question">{t.steps.design.title}</legend>
          <div className="calc-choices grid gap-3" role="radiogroup">
            {t.steps.design.options.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={state.design === opt.value}
                onClick={() =>
                  patch({ design: opt.value as EstimateFormState["design"] })
                }
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </fieldset>
      );

    case "condition":
      return (
        <fieldset>
          <legend className="calc-question">{t.steps.condition.title}</legend>
          <div className="calc-choices grid gap-3 sm:grid-cols-2" role="radiogroup">
            {t.steps.condition.options.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={state.condition === opt.value}
                onClick={() =>
                  patch({
                    condition: opt.value as EstimateFormState["condition"],
                  })
                }
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </fieldset>
      );

    case "start":
      return (
        <fieldset>
          <legend className="calc-question">{t.steps.start.title}</legend>
          <div className="calc-choices grid gap-3 sm:grid-cols-2" role="radiogroup">
            {t.steps.start.options.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={state.start === opt.value}
                onClick={() =>
                  patch({ start: opt.value as EstimateFormState["start"] })
                }
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </fieldset>
      );

    case "lead":
      return (
        <div>
          <h3 className="calc-question">{t.steps.lead.title}</h3>
          <p className="calc-hint calc-muted type-body-sm">
            {t.steps.lead.disclaimer}
          </p>
          <div className="calc-choices grid gap-2">
            <div>
              <label htmlFor={`${formId}-name`} className="label calc-muted">
                {t.steps.lead.name}
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                autoComplete="name"
                maxLength={80}
                placeholder={t.steps.lead.namePlaceholder}
                value={state.name}
                aria-invalid={fieldError.name ? true : undefined}
                aria-describedby={nameErrorId}
                onChange={(event) => patch({ name: event.target.value })}
                onBlur={() => onBlurField("name", state.name)}
                className={`calc-field mt-2 w-full border-b bg-transparent py-3 text-lg outline-none ${
                  fieldError.name ? "is-invalid" : ""
                }`}
              />
              <FieldFeedback id={nameErrorId} message={fieldError.name ?? null} />
            </div>
            <div>
              <label htmlFor={`${formId}-phone`} className="label calc-muted">
                {t.steps.lead.phone}
              </label>
              <input
                id={`${formId}-phone`}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t.steps.lead.phonePlaceholder}
                value={state.phone}
                aria-invalid={fieldError.phone ? true : undefined}
                aria-describedby={`${phoneHintId} ${phoneErrorId}`}
                onChange={(event) =>
                  patch({ phone: sanitizePhoneInput(event.target.value) })
                }
                onBlur={() => onBlurField("phone", state.phone)}
                className={`calc-field mt-2 w-full border-b bg-transparent py-3 text-lg outline-none ${
                  fieldError.phone ? "is-invalid" : ""
                }`}
              />
              <p id={phoneHintId} className="calc-muted type-body-sm mt-2">
                {t.steps.lead.phoneHint}
              </p>
              <FieldFeedback id={phoneErrorId} message={fieldError.phone ?? null} />
            </div>
            <div>
              <label htmlFor={`${formId}-telegram`} className="label calc-muted">
                {t.steps.lead.telegram}{" "}
                <span className="calc-faint">({t.steps.lead.telegramOptional})</span>
              </label>
              <input
                id={`${formId}-telegram`}
                type="text"
                autoComplete="off"
                maxLength={64}
                placeholder={t.steps.lead.telegramPlaceholder}
                value={state.telegram}
                onChange={(event) => patch({ telegram: event.target.value })}
                className="calc-field mt-2 w-full border-b bg-transparent py-3 text-lg outline-none"
              />
              <FieldFeedback id={`${formId}-telegram-error`} message={null} />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
