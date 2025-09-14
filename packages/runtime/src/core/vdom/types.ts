import type { FunctionalComponent, Props } from "../jsx.ts";

export const NODE_TYPE_TEXT = "TEXT";
export const NODE_TYPE_COMMENT = "COMMENT";
export const NODE_TYPE_FRAGMENT = "FRAGMENT";
export const NODE_TYPE_HOST = "HOST";

export type VNode = {
  $type$: string | FunctionalComponent;
  $props$?: Props;
  $children$?: Array<VNode | null>;
  $key$: string | number | null;
  $elm$?: HTMLElement | Text | Comment | null;
  $text$?: string;
};
