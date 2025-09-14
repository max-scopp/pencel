import { type createPerformanceTree, throwConsumerError } from "@pencel/utils";
import { isVNode } from "src/utils/isVNode.ts";
import { setAttributes } from "../attributes.ts";
import {
  NODE_TYPE_COMMENT,
  NODE_TYPE_FRAGMENT,
  NODE_TYPE_HOST,
  NODE_TYPE_TEXT,
  type VNode,
} from "./types.ts";

const PERF_CREATE_PREFIX = "create-";

export function createDOM(
  vnode: VNode,
  perf: ReturnType<typeof createPerformanceTree>,
): HTMLElement | Text | Comment {
  const nodeType = String(vnode.$type$);

  if (vnode.$type$ === NODE_TYPE_COMMENT) {
    const comment = document.createComment(vnode.$text$ || "");
    vnode.$elm$ = comment;
    return comment;
  }

  if (vnode.$type$ === NODE_TYPE_TEXT) {
    const text = document.createTextNode(vnode.$text$ || "");
    vnode.$elm$ = text;
    return text;
  }

  if (
    typeof vnode === "string" ||
    typeof vnode === "number" ||
    typeof vnode === "boolean"
  ) {
    const result = document.createTextNode(String(vnode));
    return result;
  }

  // Handle fragments - they don't create DOM nodes, just render children
  if (vnode.$type$ === NODE_TYPE_FRAGMENT) {
    throwConsumerError(
      "Fragment nodes should not be processed by createDOM directly. Fragments are virtual containers that only render their children.",
    );
  }

  // this should not happen in createDOM, Host should be handled at render level
  if (vnode.$type$ === NODE_TYPE_HOST) {
    throwConsumerError(
      "Host element should not be processed by createDOM. Host elements should only be used as the root element in component render() methods.",
    );
  }

  // Only log performance for element creation (text/comment creation is negligible)
  perf.start(`${PERF_CREATE_PREFIX}${nodeType}`);

  const element = vnode.$props$?.is
    ? document.createElement(String(vnode.$type$), {
        is: String(vnode.$props$.is),
      })
    : document.createElement(String(vnode.$type$));

  // Set attributes and properties
  setAttributes(element, vnode.$props$);

  // Create all children at once
  if (vnode.$children$ && vnode.$children$.length > 0) {
    for (const child of vnode.$children$) {
      if (child != null && isVNode(child)) {
        // Handle fragments - append their children directly to the parent
        if (child.$type$ === NODE_TYPE_FRAGMENT) {
          if (child.$children$) {
            for (const fragChild of child.$children$) {
              if (fragChild != null && isVNode(fragChild)) {
                const childElement = createDOM(fragChild, perf);
                element.appendChild(childElement);
              }
            }
          }
        } else {
          const childElement = createDOM(child, perf);
          element.appendChild(childElement);
        }
      }
    }
  }

  vnode.$elm$ = element;
  perf.end(`${PERF_CREATE_PREFIX}${nodeType}`);
  return element;
}
