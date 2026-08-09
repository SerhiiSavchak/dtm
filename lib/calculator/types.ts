export type ObjectType = "apartment" | "house" | "commercial";
export type RenovationType = "cosmetic" | "capital" | "turnkey";
export type DesignStatus = "yes" | "no" | "consult";
export type Condition =
  | "newbuild"
  | "secondary"
  | "demolished"
  | "other";
export type StartWindow = "asap" | "1-3" | "3-6" | "later";

export type EstimateFormState = {
  objectType: ObjectType | null;
  area: string;
  rooms: string;
  renovationType: RenovationType | null;
  design: DesignStatus | null;
  condition: Condition | null;
  start: StartWindow | null;
  name: string;
  phone: string;
  telegram: string;
};

export type EstimatePayload = {
  objectType: ObjectType;
  area: number;
  rooms: number | null;
  renovationType: RenovationType;
  design: DesignStatus;
  condition: Condition;
  start: StartWindow;
  name: string;
  phone: string;
  telegram?: string;
  locale: "uk" | "en";
};

export const initialEstimateState: EstimateFormState = {
  objectType: null,
  area: "",
  rooms: "",
  renovationType: null,
  design: null,
  condition: null,
  start: null,
  name: "",
  phone: "",
  telegram: "",
};

export type CalcStepId =
  | "objectType"
  | "area"
  | "rooms"
  | "renovationType"
  | "design"
  | "condition"
  | "start"
  | "lead";

export function getStepSequence(
  objectType: ObjectType | null
): CalcStepId[] {
  const base: CalcStepId[] = ["objectType", "area"];
  if (objectType === "apartment" || objectType === "house") {
    base.push("rooms");
  }
  base.push("renovationType", "design", "condition", "start", "lead");
  return base;
}
