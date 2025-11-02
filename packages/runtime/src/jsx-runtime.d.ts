import type { ComponentFunction, Props, PropsWithChildren } from "./core/jsx/types.ts";
import type { CustomElement } from "./core/types.ts";
import "./core/jsx/jsx.d.ts";

declare function Fragment(props: PropsWithChildren): JSX.Element;
declare function Host(this: CustomElement, props?: Props): JSX.Element;

export { Fragment, Host };

/**
 * jsx/jsxs for production mode
 */
export declare function jsx(
  type: string | ComponentFunction,
  props?: { children?: JSX.Children; key?: string | number },
  key?: string | number,
): JSX.Element;

export declare const jsxs: typeof jsx;
