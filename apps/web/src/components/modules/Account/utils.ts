import { ConvexError } from "convex/values";

export type FormStatus = { type: "error" | "success"; message: string } | null;

export function getErrorMessage(err: unknown) {
  return err instanceof ConvexError && typeof err.data === "string"
    ? err.data
    : "Something went wrong. Please try again.";
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
