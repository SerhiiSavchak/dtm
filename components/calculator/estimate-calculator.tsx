"use client";

import { useId, useMemo, useState } from "react";
import { useDictionary, useLocale } from "@/lib/i18n/locale-context";
import {
  getStepSequence,
  initialEstimateState,
  type CalcStepId,
  type EstimateFormState,
  type ObjectType,
} from "@/lib/calculator/types";

type Phase = "form" | "submitting" | "success" | "error";

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
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full px-6 py-5 text-left type-body font-medium transition-colors duration-300 md:text-lg calc-option ${
        selected ? "is-selected" : ""
      }`}
    >
      {children}
    </button>
  );
}

export function EstimateCalculator() {
  const t = useDictionary().calculator;
  const { locale } = useLocale();
  const formId = useId();

  const [state, setState] = useState<EstimateFormState>(initialEstimateState);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const steps = useMemo(
    () => getStepSequence(state.objectType),
    [state.objectType]
  );
  const currentIndex = Math.min(stepIndex, steps.length - 1);
  const stepId = steps[currentIndex] ?? "objectType";
  const progress = (currentIndex / Math.max(steps.length, 1)) * 100;

  function patch(partial: Partial<EstimateFormState>) {
    setState((prev) => ({ ...prev, ...partial }));
    setError(null);
  }

  function goTo(index: number) {
    setDirection(index < currentIndex ? -1 : 1);
    setAnimKey((k) => k + 1);
    setStepIndex(index);
    setError(null);
  }

  function validateCurrent(): boolean {
    switch (stepId) {
      case "objectType":
        if (!state.objectType) {
          setError(t.errors.required);
          return false;
        }
        return true;
      case "area": {
        const area = Number(state.area);
        if (!Number.isFinite(area) || area < 1 || area > 2000) {
          setError(t.errors.area);
          return false;
        }
        return true;
      }
      case "rooms":
        if (state.rooms) {
          const rooms = Number(state.rooms);
          if (!Number.isFinite(rooms) || rooms < 1 || rooms > 30) {
            setError(t.errors.required);
            return false;
          }
        }
        return true;
      case "renovationType":
        if (!state.renovationType) {
          setError(t.errors.required);
          return false;
        }
        return true;
      case "design":
        if (!state.design) {
          setError(t.errors.required);
          return false;
        }
        return true;
      case "condition":
        if (!state.condition) {
          setError(t.errors.required);
          return false;
        }
        return true;
      case "start":
        if (!state.start) {
          setError(t.errors.required);
          return false;
        }
        return true;
      case "lead": {
        if (!state.name.trim()) {
          setError(t.errors.name);
          return false;
        }
        const digits = state.phone.replace(/\D/g, "");
        if (digits.length < 9) {
          setError(t.errors.phone);
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  }

  function handleNext() {
    if (!validateCurrent()) return;
    if (currentIndex < steps.length - 1) {
      goTo(currentIndex + 1);
    }
  }

  function handleBack() {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }

  async function handleSubmit() {
    if (!validateCurrent()) return;
    setPhase("submitting");
    setError(null);

    const payload = {
      objectType: state.objectType,
      area: Number(state.area),
      rooms: state.rooms ? Number(state.rooms) : null,
      renovationType: state.renovationType,
      design: state.design,
      condition: state.condition,
      start: state.start,
      name: state.name.trim(),
      phone: state.phone.trim(),
      telegram: state.telegram.trim() || undefined,
      locale,
    };

    // Temporary debug visibility until Telegram/email delivery is wired
    console.group("DTM Calculator Lead");
    console.log(payload);
    console.groupEnd();

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setPhase("error");
        setError(t.errors.submit);
        return;
      }

      setPhase("success");
    } catch {
      setPhase("error");
      setError(t.errors.submit);
    }
  }

  function reset() {
    setState(initialEstimateState);
    setStepIndex(0);
    setPhase("form");
    setError(null);
    setAnimKey((k) => k + 1);
  }

  const objectLabel =
    t.steps.objectType.options.find((o) => o.value === state.objectType)
      ?.label ?? "—";

  if (phase === "success") {
    return (
      <div className="calc-step-enter space-y-8">
        <div>
          <p className="label text-accent">DTM</p>
          <h3 className="mt-4 type-h2">{t.success.title}</h3>
          <p className="calc-muted mt-4 max-w-lg type-body-lg">
            {t.success.body}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "#contacts"}
            className="btn btn-primary"
          >
            {t.success.telegram}
          </a>
          <a
            href={process.env.NEXT_PUBLIC_PHONE_URL || "#contacts"}
            className="btn btn-ghost"
          >
            {t.success.call}
          </a>
        </div>
        <button
          type="button"
          onClick={reset}
          className="label calc-muted transition-colors hover:text-[var(--calc-fg)]"
        >
          {t.success.again}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="label calc-muted">
            {t.stepOf} {currentIndex + 1} / {steps.length}
          </span>
          <span className="label text-accent">{Math.round(progress)}%</span>
        </div>
        <div
          className="h-0.5 w-full calc-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={t.progress}
        >
          <div
            className="h-0.5 bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {(state.objectType || state.area) && (
          <p className="calc-muted type-body-sm mt-3">
            {state.objectType && (
              <span>
                {t.context.object}: {objectLabel}
              </span>
            )}
            {state.objectType && state.area && <span aria-hidden> · </span>}
            {state.area && (
              <span>
                {t.context.area}: {state.area} {t.steps.area.unit}
              </span>
            )}
          </p>
        )}
      </div>

      <div
        key={`${stepId}-${animKey}`}
        className={`min-h-[15rem] md:min-h-[17rem] ${
          direction < 0 ? "calc-step-enter-back" : "calc-step-enter"
        }`}
      >
        <StepBody
          stepId={stepId}
          state={state}
          patch={patch}
          formId={formId}
          onSelectObject={(value) => {
            patch({ objectType: value });
            // Rebuild sequence from object type immediately
          }}
        />
      </div>

      {error && (
        <p className="type-body-sm text-accent" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0 || phase === "submitting"}
          className="type-small calc-muted transition-colors hover:text-[var(--calc-fg)] disabled:opacity-30"
        >
          ← {t.back}
        </button>

        {stepId === "lead" ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={phase === "submitting"}
            className="btn btn-primary w-full sm:w-auto sm:min-w-[16rem]"
          >
            {phase === "submitting" ? "…" : t.submit}
            <span className="btn-arrow" aria-hidden>
              →
            </span>
          </button>
        ) : stepId === "rooms" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                patch({ rooms: "" });
                goTo(currentIndex + 1);
              }}
              className="btn btn-ghost"
            >
              {t.steps.rooms.skip}
            </button>
            <button type="button" onClick={handleNext} className="btn btn-primary">
              {t.next}
              <span className="btn-arrow" aria-hidden>
                →
              </span>
            </button>
          </div>
        ) : (
          <button type="button" onClick={handleNext} className="btn btn-primary">
            {t.next}
            <span className="btn-arrow" aria-hidden>
              →
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function StepBody({
  stepId,
  state,
  patch,
  formId,
  onSelectObject,
}: {
  stepId: CalcStepId;
  state: EstimateFormState;
  patch: (partial: Partial<EstimateFormState>) => void;
  formId: string;
  onSelectObject: (value: ObjectType) => void;
}) {
  const t = useDictionary().calculator;

  switch (stepId) {
    case "objectType":
      return (
        <fieldset>
          <legend className="calc-question">{t.steps.objectType.title}</legend>
          <div className="mt-7 grid gap-3">
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
          <p className="calc-muted type-body-sm mt-2">{t.steps.area.hint}</p>
          <div className="mt-6 flex items-end gap-3 border-b border-[color:var(--calc-line)] pb-3">
            <input
              id={`${formId}-area`}
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              placeholder={t.steps.area.placeholder}
              value={state.area}
              onChange={(e) => patch({ area: e.target.value })}
              className="calc-field w-full bg-transparent text-4xl font-semibold tracking-tight outline-none md:text-5xl"
            />
            <span className="pb-1 font-mono text-sm text-accent">
              {t.steps.area.unit}
            </span>
          </div>
        </div>
      );

    case "rooms":
      return (
        <div>
          <label htmlFor={`${formId}-rooms`} className="calc-question">
            {t.steps.rooms.title}
          </label>
          <p className="calc-muted type-body-sm mt-2">{t.steps.rooms.hint}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patch({ rooms: String(n) })}
                aria-pressed={state.rooms === String(n)}
                className={`min-h-14 min-w-14 px-4 py-3 text-lg font-medium transition-colors calc-option ${
                  state.rooms === String(n) ? "is-selected" : ""
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            id={`${formId}-rooms`}
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={state.rooms}
            onChange={(e) => patch({ rooms: e.target.value })}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
        </div>
      );

    case "renovationType":
      return (
        <fieldset>
          <legend className="calc-question">
            {t.steps.renovationType.title}
          </legend>
          <div className="mt-7 grid gap-3">
            {t.steps.renovationType.options.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={state.renovationType === opt.value}
                onClick={() =>
                  patch({
                    renovationType:
                      opt.value as EstimateFormState["renovationType"],
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
          <div className="mt-6 grid gap-3">
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
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
        <div className="space-y-6">
          <h3 className="calc-question">{t.steps.lead.title}</h3>
          <p className="calc-muted type-body-sm max-w-lg">
            {t.steps.lead.disclaimer}
          </p>
          <div className="grid gap-5">
            <div>
              <label
                htmlFor={`${formId}-name`}
                className="label calc-muted"
              >
                {t.steps.lead.name}
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                autoComplete="name"
                placeholder={t.steps.lead.namePlaceholder}
                value={state.name}
                onChange={(e) => patch({ name: e.target.value })}
                className="calc-field mt-2 w-full border-b bg-transparent py-3 text-lg outline-none focus:border-accent"
              />
            </div>
            <div>
              <label
                htmlFor={`${formId}-phone`}
                className="label calc-muted"
              >
                {t.steps.lead.phone}
              </label>
              <input
                id={`${formId}-phone`}
                type="tel"
                autoComplete="tel"
                placeholder={t.steps.lead.phonePlaceholder}
                value={state.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                className="calc-field mt-2 w-full border-b bg-transparent py-3 text-lg outline-none focus:border-accent"
              />
            </div>
            <div>
              <label
                htmlFor={`${formId}-telegram`}
                className="label calc-muted"
              >
                {t.steps.lead.telegram}{" "}
                <span className="calc-faint">
                  ({t.steps.lead.telegramOptional})
                </span>
              </label>
              <input
                id={`${formId}-telegram`}
                type="text"
                autoComplete="off"
                placeholder={t.steps.lead.telegramPlaceholder}
                value={state.telegram}
                onChange={(e) => patch({ telegram: e.target.value })}
                className="calc-field mt-2 w-full border-b bg-transparent py-3 text-lg outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
