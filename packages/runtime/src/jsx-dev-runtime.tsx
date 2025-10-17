import type { ComponentFunction } from "./core/jsx/types.ts";
import type { JSXChildren, VNode } from "./core/vdom/types.ts";
import { jsx } from "./jsx-runtime.tsx";

export * from "./core/jsx/jsx.js";
export * from "./core/jsx/jsx-helpers.ts";

/**
 * jsxDEV for dev mode
 */
export function jsxDEV(
  type: string | ComponentFunction,
  props: { children?: JSXChildren; key?: string | number } = {},
  key?: string | number,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number,
): VNode {
  const node = jsx(type, props, key);

  node.fileName = fileName;
  node.lineNumber = lineNumber;
  node.columnNumber = columnNumber;

  return node;
}
