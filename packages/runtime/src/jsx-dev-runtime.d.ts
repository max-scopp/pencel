import type { ComponentFunction, Props, PropsWithChildren } from "./core/jsx/types.ts";
import type { CustomElement } from "./core/types.ts";
import "./core/jsx/jsx.d.ts";

declare function Fragment(props: PropsWithChildren): JSX.Element;
declare function Host(this: CustomElement, props?: Props): JSX.Element;

export { Fragment, Host };

/**
 * jsxDEV for development mode with debugging info
 */
export declare function jsxDEV(
  type: string | ComponentFunction,
  props?: { children?: JSX.Children; key?: string | number },
  key?: string | number,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number,
): JSX.Element & {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
};
