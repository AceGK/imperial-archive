import type { ComponentType, SVGProps } from "react";
import PlusIcon from "@/components/icons/plus.svg";
import HourglassIcon from "@/components/icons/hourglass.svg";
import HalfCircleIcon from "@/components/icons/half-circle.svg";
import CheckIcon from "@/components/icons/check.svg";

export type ReadingStatus = "want" | "reading" | "read" | null;

/** Each click moves to the next status, wrapping from Read back to Unread */
export const STATUS_STEPS: {
  status: ReadingStatus;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { status: null, label: "Unread", icon: PlusIcon },
  { status: "want", label: "Want to read", icon: HourglassIcon },
  { status: "reading", label: "Reading", icon: HalfCircleIcon },
  { status: "read", label: "Read", icon: CheckIcon },
];

/** The current step, the one after it, and how far along the current one is */
export function statusSteps(status: ReadingStatus) {
  const index = STATUS_STEPS.findIndex((s) => s.status === status);
  return {
    index,
    step: STATUS_STEPS[index],
    next: STATUS_STEPS[(index + 1) % STATUS_STEPS.length],
  };
}
