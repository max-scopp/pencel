import { VNodeKind } from "./types.ts";

/**
 * Decide VNode kind based on type
 */
export function getVNodeKind(type: unknown): VNodeKind {
  if (typeof type === "function") return VNodeKind.Component;
  if (typeof type === "string") {
    // naive check: if it contains a dash, assume it's a custom element
    return type.includes("-") ? VNodeKind.Host : VNodeKind.Tag;
  }
  throw new Error("Invalid JSX type");
}
