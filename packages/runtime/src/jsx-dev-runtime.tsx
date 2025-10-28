import type { ComponentFunction } from "./core/jsx/types.ts";
import { jsx } from "./jsx-runtime.tsx";

export * from "./core/jsx/jsx-helpers.ts";

/**
 * jsxDEV for dev mode
 */
export function jsxDEV(
  type: string | ComponentFunction,
  props: { children?: JSX.Children; key?: string | number } = {},
  key?: string | number,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number,
): { [k: string]: unknown } {
  const node = jsx(type, props, key);

  node.fileName = fileName;
  node.lineNumber = lineNumber;
  node.columnNumber = columnNumber;

  return node;
}
