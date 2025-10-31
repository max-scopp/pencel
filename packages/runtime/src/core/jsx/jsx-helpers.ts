import type { CustomElement } from "../types.ts";
import type { Props, PropsWithChildren } from "./types.ts";

class CompileTimeConstructError extends Error {
  constructor(constructName: string) {
    super(`${constructName} is a compile-time construct`);
    this.name = "CompileTimeConstructError";
  }
}

/**
 * Fragment component for rendering multiple children without a wrapper.
 * Used at compile-time; throws if called at runtime.
 */
export function Fragment(_props: PropsWithChildren): JSX.Element {
  throw new CompileTimeConstructError("Fragment");
}

/**
 * Host component that represents the custom element itself.
 * Used within a component to render into the element's shadow DOM or directly.
 * Used at compile-time; throws if called at runtime.
 */
export function Host(this: CustomElement, _props?: Props): JSX.Element {
  throw new CompileTimeConstructError("Host");
}
