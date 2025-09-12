import type { Props } from "./jsx.ts";

const eventPattern = /^on[A-Z]/;

export function setAttributes(element: HTMLElement, props: Props | undefined): void {
  for (const [key, value] of Object.entries(props ?? {})) {
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
        // Handle boolean attributes
        if (value === true) {
          element.setAttribute(key, "");
        } else if (value === false || value == null) {
          element.removeAttribute(key);
        } else {
          element.setAttribute(key, String(value));
        }
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
