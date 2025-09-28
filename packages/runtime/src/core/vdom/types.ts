import type { ComponentFunction } from "../jsx/types.ts";

export enum VNodeKind {
  Text,
  Comment,
  Fragment,
  Host, // a registered custom element / web component
  Component, // a function component
  Tag, // literal DOM tag like 'div', 'footer', 'center'
}

export type VNode =
  | VTextNode
  | VCommentNode
  | VFragmentNode
  | VHostNode
  | VComponentNode
  | VTagNode;

export type JSXChild =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | JSXChild[];

export type JSXChildren = JSXChild | JSXChild[];

export interface DevInfo {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface VTextNode extends DevInfo {
  k: VNodeKind.Text;
  text: string;
  el?: Text | null;
  i?: string | number | null;
}

export interface VCommentNode extends DevInfo {
  k: VNodeKind.Comment;
  text: string;
  el?: Comment | null;
  i?: string | number | null;
}

export interface VFragmentNode extends DevInfo {
  k: VNodeKind.Fragment;
  c: Array<VNode | null>;
  i?: string | number | null;
}

export interface VHostNode extends DevInfo {
  k: VNodeKind.Host;
  el: Element; // Host element must exist
  p?: Record<string, unknown>;
  c?: Array<VNode | null>;
  i?: string | number | null;
  olp?: Record<string, unknown>; // previous props (for diffing)
}

export interface VComponentNode extends DevInfo {
  k: VNodeKind.Component;
  f: ComponentFunction;
  p?: Record<string, unknown>;
  c?: Array<VNode | null>;
  el?: Element | null;
  i?: string | number | null;
}

export interface VTagNode extends DevInfo {
  k: VNodeKind.Tag;
  tag: string;
  el?: Element;
  p?: Record<string, unknown>;
  c?: Array<VNode | null>;
  i?: string | number | null;
  olp?: Record<string, unknown>; // previous props (for diffing)
}
