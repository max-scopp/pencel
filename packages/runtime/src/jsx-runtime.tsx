import type { ComponentFunction } from "./core/jsx/types.ts";

export * from "./core/jsx/jsx-helpers.ts";

/**
 * jsx/jsxs for production
 */
export function jsx(
  _type: string | ComponentFunction,
  _props: { children?: JSX.Children; key?: string | number } = {},
  _key?: string | number,
): { [k: string]: unknown } {
  return {};
}

export { jsx as jsxs };
