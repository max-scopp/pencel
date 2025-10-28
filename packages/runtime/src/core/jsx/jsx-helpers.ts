import type { CustomElement } from "../types.ts";
import type { Props, PropsWithChildren } from "./types.ts";

export function Fragment(props: PropsWithChildren): JSX.Element {
  return {};
}

/**
 * A meta-component that represents a registered custom element.
 * No tag type is needed — the element is already registered in the DOM.
 */
export function Host(this: CustomElement, props: Props = {}): JSX.Element {
  return {};
}
