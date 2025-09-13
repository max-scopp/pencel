import type { PropOptions } from "../decorators/prop.ts";

/**
 * Handles type conversion for attribute values based on prop options
 */

export function convertAttributeValue(
  value: string | null,
  propOptions?: PropOptions,
  hasAttribute = false,
): unknown {
  if (!propOptions?.type) {
    return value;
  }

  if (propOptions.type === Boolean) {
    if (hasAttribute) {
      return true; // presence means true
    }

    return false; // absence means false
  }

  switch (propOptions.type) {
    default:
      return propOptions.type(value);
  }
}
