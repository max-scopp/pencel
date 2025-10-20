import { dashCase } from "@pencel/utils";
import type { ComponentInterfaceWithContext } from "../core/types.ts";
import type { PropOptions } from "../decorators/prop.ts";

/**
 * Handles type conversion for attribute values based on prop options
 */
export function coerceAttributeValue(
  value: string | null,
  propOptions?: PropOptions,
  hasAttribute = false,
): unknown {
  if (!propOptions?.type) {
    return value;
  }

  switch (propOptions.type) {
    case Boolean: {
      switch (value) {
        case "false":
        case "0":
        case "no":
        case "off":
          return false;
        default:
          return hasAttribute ? true : Boolean(value);
      }
    }
    default:
      return propOptions.type(value);
  }
}

export function resolveAttribute(
  component: ComponentInterfaceWithContext,
  propName: string | symbol,
  propOptions?: PropOptions,
): string {
  const attrName = resolveAttributeName(propName, propOptions);
  const attrValue = component.getAttribute(attrName);

  return coerceAttributeValue(
    attrValue,
    propOptions,
    component.hasAttribute(attrName),
  ) as string;
}

export function serializeAttributeValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  return String(value);
}

export function reflectAttributeValue(
  component: ComponentInterfaceWithContext,
  attrName: string,
  value: unknown,
  propOptions: PropOptions,
): void {
  if (value == null) {
    component.removeAttribute(attrName);
    return;
  }

  switch (propOptions.type) {
    case Boolean: {
      if (value === true) {
        component.setAttribute(attrName, "");
      } else {
        component.removeAttribute(attrName);
      }
      return;
    }
    default:
      component.setAttribute(attrName, serializeAttributeValue(value));
  }
}

export function resolveAttributeName(
  propName: string | number | symbol,
  propOptions?: PropOptions,
): string {
  return typeof propOptions?.attr === "function"
    ? propOptions.attr(propName)
    : propOptions?.attr || dashCase(String(propName));
}
