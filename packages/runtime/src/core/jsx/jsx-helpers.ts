import type { CustomElement } from "../types.ts";
import type { Props, PropsWithChildren } from "./types.ts";

/**
 * Fragment component for rendering multiple children without a wrapper.
 * Used at compile-time; throws if called at runtime.
 */
export function Fragment(_props: PropsWithChildren): JSX.Element {
  throw new Error(
    "Fragment should not be called at runtime - it's a compile-time construct",
  );
}

/**
 * Host component that represents the custom element itself.
 * Used within a component to render into the element's shadow DOM or directly.
 * Used at compile-time; throws if called at runtime.
 */
export function Host(this: CustomElement, _props?: Props): JSX.Element {
  throw new Error(
    "Host should not be called at runtime - it's a compile-time construct",
  );
}
