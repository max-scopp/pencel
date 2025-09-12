import { createPerformanceTree } from "@pencil/utils";
import type { JSXElement, VNode } from "./types.ts";

// Global performance tracker for JSX operations
export const jsxPerf = createPerformanceTree();

export type Props = Record<string, unknown>;
export type ComponentType = (props: Props) => JSXElement | null;

export function h(
  type: string | ComponentType,
  props?: Props | null,
  ...children: unknown[]
): JSXElement {
  jsxPerf.start("jsx-creation");

  const result: JSXElement = {
    type: type,
    props: props || {},
    children: children
      .flat()
      .map((child) =>
        typeof child === "string" ||
        typeof child === "number" ||
        typeof child === "boolean" ||
        child === null
          ? child
          : (child as JSXElement),
      ),
    key: props?.key as string | number | undefined,
  };

  jsxPerf.end("jsx-creation");
  return result;
}

export function toVNode(
  jsx: JSXElement | string | number | boolean | null,
): VNode {
  jsxPerf.start("vnode-conversion");

  if (
    typeof jsx === "string" ||
    typeof jsx === "number" ||
    typeof jsx === "boolean"
  ) {
    jsxPerf.end("vnode-conversion");
    return {
      $type$: "TEXT",
      $props$: {},
      $children$: [],
      $key$: null,
      $elm$: null,
      $text$: String(jsx),
    };
  }

  if (jsx === null) {
    jsxPerf.end("vnode-conversion");
    return {
      $type$: "COMMENT",
      $props$: {},
      $children$: [],
      $key$: null,
      $elm$: null,
      $text$: "",
    };
  }

  let type: string;

  if (typeof jsx.type === "function") {
    // For component functions, we need to execute them to get the actual JSX
    jsxPerf.start("component-render");
    const componentResult = jsx.type({
      ...jsx.props,
      children: jsx.children || [],
    });
    jsxPerf.end("component-render");

    if (componentResult === null) {
      // Component returned null, create a comment node
      jsxPerf.end("vnode-conversion");
      return {
        $type$: "COMMENT",
        $props$: {},
        $children$: [],
        $key$: jsx.key ?? null,
        $elm$: null,
        $text$: "",
      };
    }

    // Recursively convert the component's result
    const result = toVNode(componentResult);
    jsxPerf.end("vnode-conversion");
    return result;
  } else {
    type = jsx.type;
  }

  const result: VNode = {
    $type$: type,
    $props$: jsx.props,
    $children$: (jsx.children || []).map((child) => {
      if (child == null) {
        return null;
      }

      return toVNode(child);
    }),
    $key$: jsx.key ?? null,
    $elm$: null,
  };

  jsxPerf.end("vnode-conversion");
  return result;
}

jsxPerf.end("root");
jsxPerf.log();
