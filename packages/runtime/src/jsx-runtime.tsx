import type { FunctionalComponent } from "./core/jsx/jsx.ts";

export { h as jsx, h as jsxs } from "./core/jsx/jsx.ts";
export type * from "./core/jsx/jsx-runtime.d.ts";

/**
 * A fragment component that simply returns its children.
 * Useful for grouping multiple elements without adding extra nodes to the DOM.
 */
export const Fragment: FunctionalComponent = (_, children) => children;
