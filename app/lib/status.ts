import type { RequestStatus } from "./types";

export const tone = (st: RequestStatus) =>
  st === "closed_solved" ? ("green" as const)
  : st === "refunded" || st === "under_review" ? ("gold" as const)
  : st === "cancelled" ? ("neutral" as const)
  : ("blue" as const);
