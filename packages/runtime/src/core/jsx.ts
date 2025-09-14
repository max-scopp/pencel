import {
  NODE_TYPE_COMMENT,
  NODE_TYPE_FRAGMENT,
  NODE_TYPE_TEXT,
  type VNode,
} from "./vdom/types.ts";

export type Props = Record<string, unknown>;

/**
 * A JSX element can be:
 * - A standard HTML element (e.g. 'div', 'span')
 * - A functional component (a function that returns JSX)
 * - A string, number, boolean, or null (for text nodes or empty nodes)
 * - An array of JSX elements (to represent multiple children)
 * - A VNode (for direct VNode usage)
 */
export type JSXElement =
  | {
      type: string | ComponentFunction;
      props: Record<string, unknown>;
      children?: Array<
        JSXElement | string | number | boolean | null | VNode | VNode[]
      >;
      key?: string | number;
    }
  | JSXElement[]
  | null
  | string
  | number
  | boolean
  | VNode
  | VNode[];

/**
 * A component function that takes props and returns JSX.
 */
export type ComponentFunction =
  | ((props: Record<string, unknown>) => JSXElement)
  | FunctionalComponent;

/**
 * Consumer facing type for functional components.
 */
export type FunctionalComponent<TProps extends Props = Props> = (
  props: TProps,
  children: VNode[],
) => VNode | VNode[];

export type ComponentType =
  | ((props: Props) => JSXElement | null)
  | ((props: Props, children: VNode[]) => VNode | VNode[]);

/**
 * Internal function to support JSX syntax.
 */
export function h(
  type: string | ComponentType,
  _props?: Props | null,
  ...children: unknown[]
): JSXElement {
  const { key, ...props } = _props || {};

  return {
    type: type,
    props: props || {},
    children: children as JSXElement[],
    key: key as string | number | undefined,
  };
}

export function toVNode(jsx: JSXElement): VNode {
  // Handle VNode directly
  if (jsx && typeof jsx === "object" && "$type$" in jsx && !("type" in jsx)) {
    return jsx as VNode;
  }

  // Handle VNode arrays
  if (
    Array.isArray(jsx) &&
    jsx.length > 0 &&
    jsx[0] &&
    typeof jsx[0] === "object" &&
    "$type$" in jsx[0]
  ) {
    return {
      $type$: "FRAGMENT",
      $props$: {},
      $children$: jsx as VNode[],
      $key$: null,
      $elm$: null,
    };
  }

  if (Array.isArray(jsx)) {
    const children = jsx
      .map((child) => toVNode(child))
      .filter((child): child is VNode => child !== null)
      .flat();

    return {
      $type$: NODE_TYPE_FRAGMENT,
      $props$: {},
      $children$: children,
      $key$: null,
      $elm$: null,
    };
  }

  // Skip null/undefined
  if (jsx === null || jsx === undefined) {
    return {
      $type$: "COMMENT",
      $props$: {},
      $children$: [],
      $key$: null,
      $elm$: null,
      $text$: "",
    };
  }

  if (
    typeof jsx === "string" ||
    typeof jsx === "number" ||
    typeof jsx === "boolean"
  ) {
    return {
      $type$: NODE_TYPE_TEXT,
      $props$: {},
      $children$: [],
      $key$: null,
      $elm$: null,
      $text$: String(jsx),
    };
  }

  // At this point, jsx should be a JSXElement object (not VNode)
  const jsxElement = jsx as {
    type: string | ComponentFunction;
    props: Record<string, unknown>;
    children?: Array<
      JSXElement | string | number | boolean | null | VNode | VNode[]
    >;
    key?: string | number;
  };

  let type: string;

  if (typeof jsxElement.type === "function") {
    // For component functions, we need to execute them to get the actual JSX

    // Convert children to VNodes first
    const vnodeChildren = (jsxElement.children || [])
      .map((child) => {
        if (child == null) {
          return null;
        }
        return toVNode(child as JSXElement);
      })
      .filter((child): child is VNode => child !== null);

    // Call the functional component with props and children as separate parameters
    const componentResult = (
      jsxElement.type as unknown as (
        props: Record<string, unknown>,
        children: VNode[],
      ) => unknown
    )(jsxElement.props || {}, vnodeChildren);

    if (componentResult === null) {
      // Component returned null, create a comment node
      return {
        $type$: NODE_TYPE_COMMENT,
        $props$: {},
        $children$: [],
        $key$: jsxElement.key ?? null,
        $elm$: null,
        $text$: "",
      };
    }

    // Handle the case where component returns multiple children (array)
    if (Array.isArray(componentResult)) {
      // For multiple children, we need to wrap them in a fragment-like structure
      return {
        $type$: NODE_TYPE_FRAGMENT,
        $props$: {},
        $children$: componentResult,
        $key$: jsxElement.key ?? null,
        $elm$: null,
      };
    }

    // Check if the result is already a VNode (from FunctionalComponent)
    if (
      componentResult &&
      typeof componentResult === "object" &&
      "$type$" in componentResult
    ) {
      return componentResult as VNode;
    }

    // Recursively convert the component's result (for regular components)
    const result = toVNode(componentResult as JSXElement);
    return result;
  } else {
    type = jsxElement.type as string;
  }

  const result: VNode = {
    $type$: type,
    $props$: jsxElement.props,
    $children$: (jsxElement.children || [])
      .flatMap((child) => {
        if (child == null) {
          return null;
        }
        const converted = toVNode(child as JSXElement);
        // If the child conversion returned an array (flattened), spread it
        if (Array.isArray(converted)) {
          return converted;
        }
        return converted;
      }) // Flatten any nested arrays
      .filter((child): child is VNode => child !== null),
    $key$: jsxElement.key ?? null,
    $elm$: null,
  };

  return result;
}
