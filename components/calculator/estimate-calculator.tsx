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
      className={`w-full border px-5 py-4 text-left text-base font-medium transition-colors duration-300 md:text-lg ${
        selected
          ? "border-accent bg-accent text-white"
          : "border-white/20 bg-transparent text-paper hover:border-white/50 hover:bg-white/5"
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

  const steps = useMemo(
    () => getStepSequence(state.objectType),
    [state.objectType]
  );
  const currentIndex = Math.min(stepIndex, steps.length - 1);
  const stepId = steps[currentIndex] ?? "objectType";
  const progress = ((currentIndex + 1) / steps.length) * 100;

  function patch(partial: Partial<EstimateFormState>) {
    setState((prev) => ({ ...prev, ...partial }));
    setError(null);
  }

  function goTo(index: number) {
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

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
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
          <h3 className="mt-4 type-h2 text-paper">{t.success.title}</h3>
          <p className="mt-4 max-w-lg type-body-lg text-paper/75">
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
          className="label text-paper/55 transition-colors hover:text-paper"
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
          <span className="label text-paper/55">
            {t.stepOf} {currentIndex + 1} / {steps.length}
          </span>
          <span className="label text-accent">{Math.round(progress)}%</span>
        </div>
        <div
          className="h-px w-full bg-white/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={t.progress}
        >
          <div
            className="h-px bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {(state.objectType || state.area) && (
          <p className="mt-3 text-sm text-paper/50">
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

      <div key={`${stepId}-${animKey}`} className="calc-step-enter min-h-[14rem]">
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
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0 || phase === "submitting"}
          className="label text-paper/55 transition-colors hover:text-paper disabled:opacity-30"
        >
          ← {t.back}
        </button>

        {stepId === "lead" ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={phase === "submitting"}
            className="btn btn-primary min-w-[16rem]"
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
          <legend className="type-h3 text-paper">{t.steps.objectType.title}</legend>
          <div className="mt-6 grid gap-3">
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
          <label htmlFor={`${formId}-area`} className="type-h3 text-paper">
            {t.steps.area.title}
          </label>
          <p className="mt-2 text-sm text-paper/55">{t.steps.area.hint}</p>
          <div className="mt-6 flex items-end gap-3 border-b border-white/25 pb-3">
            <input
              id={`${formId}-area`}
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              placeholder={t.steps.area.placeholder}
              value={state.area}
              onChange={(e) => patch({ area: e.target.value })}
              className="w-full bg-transparent text-4xl font-semibold tracking-tight text-paper outline-none placeholder:text-paper/25 md:text-5xl"
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
          <label htmlFor={`${formId}-rooms`} className="type-h3 text-paper">
            {t.steps.rooms.title}
          </label>
          <p className="mt-2 text-sm text-paper/55">{t.steps.rooms.hint}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patch({ rooms: String(n) })}
                aria-pressed={state.rooms === String(n)}
                className={`min-h-14 min-w-14 border px-4 py-3 text-lg font-medium transition-colors ${
                  state.rooms === String(n)
                    ? "border-accent bg-accent text-white"
                    : "border-white/20 text-paper hover:border-white/50"
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
          <legend className="type-h3 text-paper">
            {t.steps.renovationType.title}
          </legend>
          <div className="mt-6 grid gap-3">
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
          <legend className="type-h3 text-paper">{t.steps.design.title}</legend>
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
          <legend className="type-h3 text-paper">{t.steps.condition.title}</legend>
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
          <legend className="type-h3 text-paper">{t.steps.start.title}</legend>
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
          <h3 className="type-h3 text-paper">{t.steps.lead.title}</h3>
          <p className="max-w-lg text-sm leading-relaxed text-paper/55">
            {t.steps.lead.disclaimer}
          </p>
          <div className="grid gap-5">
            <div>
              <label
                htmlFor={`${formId}-name`}
                className="label text-paper/55"
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
                className="mt-2 w-full border-b border-white/25 bg-transparent py-3 text-lg text-paper outline-none placeholder:text-paper/30 focus:border-accent"
              />
            </div>
            <div>
              <label
                htmlFor={`${formId}-phone`}
                className="label text-paper/55"
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
                className="mt-2 w-full border-b border-white/25 bg-transparent py-3 text-lg text-paper outline-none placeholder:text-paper/30 focus:border-accent"
              />
            </div>
            <div>
              <label
                htmlFor={`${formId}-telegram`}
                className="label text-paper/55"
              >
                {t.steps.lead.telegram}{" "}
                <span className="text-paper/35">
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
                className="mt-2 w-full border-b border-white/25 bg-transparent py-3 text-lg text-paper outline-none placeholder:text-paper/30 focus:border-accent"
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
