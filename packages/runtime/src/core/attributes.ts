import type { Props } from "./jsx/types.ts";
import { PROP_NAMES } from "./types.ts";

const eventPattern = /^on[A-Z]/;

/**
 * Checks if an element has Pencil component metadata (i.e., is a Pencil custom element)
 */
function hasPencilMetadata(element: HTMLElement): boolean {
  return PROP_NAMES in element;
}

/**
 * Gets the prop names map from a Pencil custom element
 */
function getPropNames(element: HTMLElement): Map<string, unknown> | undefined {
  return (element as unknown as Record<symbol, unknown>)[PROP_NAMES] as
    | Map<string, unknown>
    | undefined;
}

/**
 * Attempts to set a property directly on a custom element if it's a declared prop,
 * otherwise falls back to setting it as an attribute
 */
function setPropOrAttribute(
  element: HTMLElement,
  key: string,
  value: unknown,
): void {
  if (hasPencilMetadata(element)) {
    const propNames = getPropNames(element);

    // If this key corresponds to a declared @Prop, set it as a property
    if (propNames?.has(key)) {
      // Directly set the property on the custom element
      (element as unknown as Record<string, unknown>)[key] = value;
      return;
    }
  }

  // Fall back to attribute setting for non-props or non-custom elements
  if (value === true) {
    element.setAttribute(key, "");
  } else if (value === false || value == null) {
    element.removeAttribute(key);
  } else {
    element.setAttribute(key, String(value));
  }
}

export function setAttributes(
  element: HTMLElement,
  props: Props | undefined,
): void {
  for (const [key, value] of Object.entries(props ?? {})) {
    // TODO: Investigate
    if (key.startsWith("__")) {
      continue;
    }

    if (key === "key" || key === "children") continue;

    // Handle event listeners
    if (eventPattern.test(key)) {
      const eventName = key.slice(2).toLowerCase();
      if (typeof value === "function") {
        element.addEventListener(eventName, value as EventListener);
      }
      continue;
    }

    // Handle special cases
    switch (key) {
      case "className":
        element.className = String(value);
        break;
      case "style":
        if (typeof value === "string") {
          element.style.cssText = value;
        } else if (value && typeof value === "object") {
          Object.assign(element.style, value);
        }
        break;
      case "ref":
        if (typeof value === "function") {
          value(element);
        }
        break;
      default:
        // Handle custom element props vs regular attributes
        setPropOrAttribute(element, key, value);
    }
  }
}

export function removeAttributes(element: HTMLElement, props: Props): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === "key" || key === "children") continue;

    // Remove event listeners
    if (eventPattern.test(key)) {
      const eventName = key.slice(2).toLowerCase();
      if (typeof value === "function") {
        element.removeEventListener(eventName, value as EventListener);
      }
      continue;
    }

    // Remove attributes
    element.removeAttribute(key);
  }
}
