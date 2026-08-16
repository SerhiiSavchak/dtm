import {
  CALC_FLOW_STEPS,
  getStepSequence,
  initialEstimateState,
  isRoomsApplicable,
  isStepApplicable,
  type CalcStepId,
  type Condition,
  type DesignStatus,
  type EstimateFormState,
  type ObjectType,
  type RenovationType,
  type StartWindow,
} from "./types";
import {
  conditionLabels,
  designLabels,
  objectTypeLabels,
  parameterFieldLabels,
  renovationTypeLabels,
  startLabels,
} from "@/lib/leads/labels";
import { formatAreaDisplay, parseArea } from "@/lib/leads/parse-area";

export type AnswerStepId = Exclude<CalcStepId, "lead">;

export const ANSWER_STEP_IDS: AnswerStepId[] = CALC_FLOW_STEPS.filter(
  (stepId): stepId is AnswerStepId => stepId !== "lead"
);

export type CalculatorSummaryCopy = {
  fieldLabels: Record<AnswerStepId, string>;
  objectType: Record<ObjectType, string>;
  renovationType: Record<RenovationType, string>;
  design: Record<DesignStatus, string>;
  condition: Record<Condition, string>;
  start: Record<StartWindow, string>;
  areaUnit: string;
};

export type SummaryItem = {
  key: AnswerStepId;
  label: string;
  value: string;
  text: string;
};

type OptionEntry = { value: string; label: string };

type CalculatorDictSlice = {
  context: Record<AnswerStepId, string>;
  steps: {
    objectType: { options: OptionEntry[] };
    renovationType: { options: OptionEntry[] };
    design: { options: OptionEntry[] };
    condition: { options: OptionEntry[] };
    start: { options: OptionEntry[] };
    area: { unit: string };
  };
};

function optionMap<T extends string>(
  options: OptionEntry[]
): Record<T, string> {
  return Object.fromEntries(options.map((opt) => [opt.value, opt.label])) as Record<
    T,
    string
  >;
}

export function summaryCopyFromDict(
  dict: CalculatorDictSlice
): CalculatorSummaryCopy {
  return {
    fieldLabels: dict.context,
    objectType: optionMap<ObjectType>(dict.steps.objectType.options),
    renovationType: optionMap<RenovationType>(dict.steps.renovationType.options),
    design: optionMap<DesignStatus>(dict.steps.design.options),
    condition: optionMap<Condition>(dict.steps.condition.options),
    start: optionMap<StartWindow>(dict.steps.start.options),
    areaUnit: dict.steps.area.unit,
  };
}

export function ownerSummaryCopy(): CalculatorSummaryCopy {
  return {
    fieldLabels: { ...parameterFieldLabels },
    objectType: { ...objectTypeLabels },
    renovationType: { ...renovationTypeLabels },
    design: { ...designLabels },
    condition: { ...conditionLabels },
    start: { ...startLabels },
    areaUnit: "м²",
  };
}

export function applyEstimatePatch(
  prev: EstimateFormState,
  partial: Partial<EstimateFormState>
): EstimateFormState {
  const next: EstimateFormState = { ...prev, ...partial };
  if (!isRoomsApplicable(next.objectType)) {
    next.rooms = "";
  }
  return next;
}

export function roomsForPayload(state: EstimateFormState): number | null {
  if (!isRoomsApplicable(state.objectType)) return null;
  const raw = state.rooms.trim();
  if (raw === "") return null;
  const rooms = Number(raw);
  if (!Number.isInteger(rooms)) return null;
  return rooms;
}

export function answersForPayload(state: EstimateFormState) {
  const area = parseArea(state.area);
  return {
    objectType: state.objectType,
    area: area.ok ? area.value : state.area,
    rooms: roomsForPayload(state),
    renovationType: state.renovationType,
    design: state.design,
    condition: state.condition,
    start: state.start,
  };
}

export function estimateStateFromOwnerSource(source: {
  objectType: ObjectType;
  area: number;
  rooms?: number | null;
  renovationType: RenovationType;
  design: DesignStatus;
  condition: Condition;
  start: StartWindow;
}): EstimateFormState {
  return {
    ...initialEstimateState,
    objectType: source.objectType,
    area: String(source.area),
    rooms: source.rooms == null ? "" : String(source.rooms),
    renovationType: source.renovationType,
    design: source.design,
    condition: source.condition,
    start: source.start,
  };
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function lookupLabel(table: Record<string, string>, id: string): string {
  return isPresent(table[id]) ? table[id] : id;
}

function formatAreaValue(raw: string, unit: string): string | null {
  if (raw.trim() === "") return null;
  const parsed = parseArea(raw);
  const display = parsed.ok ? formatAreaDisplay(parsed.value) : raw.trim();
  return `${display}\u00A0${unit}`;
}

export function formatStepAnswer(
  stepId: AnswerStepId,
  state: EstimateFormState,
  copy: CalculatorSummaryCopy
): SummaryItem | null {
  if (!isStepApplicable(stepId, state.objectType)) return null;

  const label = copy.fieldLabels[stepId];
  let value: string | null = null;

  switch (stepId) {
    case "objectType": {
      if (!isPresent(state.objectType)) return null;
      value = lookupLabel(copy.objectType, state.objectType);
      break;
    }
    case "area": {
      value = formatAreaValue(state.area, copy.areaUnit);
      break;
    }
    case "rooms": {
      if (state.rooms.trim() === "") return null;
      const rooms = Number(state.rooms);
      value = Number.isFinite(rooms) ? String(rooms) : state.rooms.trim();
      break;
    }
    case "renovationType": {
      if (!isPresent(state.renovationType)) return null;
      value = lookupLabel(copy.renovationType, state.renovationType);
      break;
    }
    case "design": {
      if (!isPresent(state.design)) return null;
      value = lookupLabel(copy.design, state.design);
      break;
    }
    case "condition": {
      if (!isPresent(state.condition)) return null;
      value = lookupLabel(copy.condition, state.condition);
      break;
    }
    case "start": {
      if (!isPresent(state.start)) return null;
      value = lookupLabel(copy.start, state.start);
      break;
    }
    default:
      return null;
  }

  if (value === null) return null;
  return { key: stepId, label, value, text: `${label}: ${value}` };
}

/**
 * Answers completed before the current visible step.
 * Nullish/empty-string checks only — "no", 0, and skipped-false values stay.
 */
export function formatCalculatorSummary(
  state: EstimateFormState,
  currentStepId: CalcStepId,
  copy: CalculatorSummaryCopy
): SummaryItem[] {
  const steps = getStepSequence(state.objectType);
  const currentIndex = steps.indexOf(currentStepId);
  const cutoff = currentIndex === -1 ? steps.length : currentIndex;
  const items: SummaryItem[] = [];
  const seen = new Set<AnswerStepId>();

  for (let index = 0; index < cutoff; index += 1) {
    const stepId = steps[index];
    if (stepId === "lead") continue;
    if (seen.has(stepId)) continue;
    const item = formatStepAnswer(stepId, state, copy);
    if (item == null) continue;
    seen.add(stepId);
    items.push(item);
  }

  return items;
}

export function commitThenAdvance(
  state: EstimateFormState,
  currentIndex: number,
  partial: Partial<EstimateFormState>
): {
  state: EstimateFormState;
  index: number;
  stepId: CalcStepId;
  steps: CalcStepId[];
} {
  const nextState = applyEstimatePatch(state, partial);
  const steps = getStepSequence(nextState.objectType);
  const clamped = Math.min(Math.max(0, currentIndex), Math.max(steps.length - 1, 0));
  const index = Math.min(clamped + 1, Math.max(steps.length - 1, 0));
  return {
    state: nextState,
    index,
    stepId: steps[index] ?? "objectType",
    steps,
  };
}
