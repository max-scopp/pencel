import type { VNode } from "../core/types.ts";

export const isVNode = (value: unknown): value is VNode =>
  value !== null && typeof value === "object" && "$type$" in value;
