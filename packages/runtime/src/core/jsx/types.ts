import type { JSXChildren, VNode } from "../vdom/types.ts";

/**
 * Props is a dictionary of string keys to unknown values.
 * NOTE: You should generally use a more specific type for props
 * in your components.
 */
export type Props = Record<string, unknown>;

/**
 * Props that definitely define optional children.
 */
export type PropsWithChildren<TProps extends Props = Props> = TProps & {
  children?: JSXChildren;
};

/**
 * Functional component: takes props (with optional children
 * in props), returns JSX.
 */
export type ComponentFunction<TProps extends Props = Props> = (
  props: TProps,
) => JSXNode | null;

/**
 * A JSX element produced by the automatic runtime.
 */
export interface JSXElement {
  type: string | ComponentFunction;
  props: Props;
  key?: string | number;
}

/**
 * Extra debugging info for jsxDEV mode.
 */
export interface JSXDevElement extends JSXElement {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * A JSX node is anything that can appear in JSX:
 * - A full element
 * - A primitive (string, number, boolean)
 * - null
 * - A VNode from your vdom
 * - An array of JSX nodes
 */
export type JSXNode =
  | JSXElement
  | string
  | number
  | boolean
  | null
  | VNode
  | JSXNode[];
