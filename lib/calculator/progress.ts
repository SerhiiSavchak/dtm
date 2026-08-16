import {
  getStepSequence,
  type CalcStepId,
  type ObjectType,
} from "./types";

/**
 * Wizard steps for the current navigation position.
 * objectType (and the rooms branch) counts only after leaving that question via Далі/Назад.
 * Selecting an option on the current step must not change the list.
 */
export function getVisibleSteps(
  objectType: ObjectType | null,
  currentStepIndex: number
): CalcStepId[] {
  const baseSteps = getStepSequence(null);
  const objectTypeIndex = baseSteps.indexOf("objectType");
  const objectTypeCommitted =
    objectTypeIndex >= 0 && currentStepIndex > objectTypeIndex;
  return getStepSequence(objectTypeCommitted ? objectType : null);
}

/**
 * One derived value for the step label, bar width, and aria-valuenow.
 * Position is 1-based: step 1/N ≈ round(100/N), last visible form step = 100%.
 * Success is not an extra question; isComplete still reports 100%.
 */
export function calculateProgress(
  currentStepIndex: number,
  totalSteps: number,
  isComplete = false
): number {
  if (isComplete) return 100;
  if (totalSteps <= 0) return 0;
  const index = Math.min(Math.max(0, currentStepIndex), totalSteps - 1);
  const currentStep = index + 1;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);
  return Math.min(100, Math.max(0, progressPercent));
}

export function resolveCalculatorProgress(
  currentStepIndex: number,
  objectType: ObjectType | null,
  isComplete = false
): {
  steps: CalcStepId[];
  currentIndex: number;
  currentStep: number;
  totalSteps: number;
  progressPercent: number;
} {
  const steps = getVisibleSteps(objectType, currentStepIndex);
  const totalSteps = steps.length;
  const currentIndex = Math.min(
    Math.max(0, currentStepIndex),
    Math.max(totalSteps - 1, 0)
  );
  const currentStep = totalSteps <= 0 ? 0 : currentIndex + 1;
  const progressPercent = calculateProgress(currentIndex, totalSteps, isComplete);
  return { steps, currentIndex, currentStep, totalSteps, progressPercent };
}
