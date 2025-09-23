import type { ComponentInterfaceWithContext } from "src/core/types.ts";
import { PENCIL_COMPONENT_CONTEXT } from "../core/symbols.ts";

export function simpleCustomElementDisplayText(
  component: ComponentInterfaceWithContext,
): string {
  const extnds = component[PENCIL_COMPONENT_CONTEXT]?.extends;
  const tagName = component.tagName.toLowerCase();

  if (extnds) {
    return `<${extnds} is="${customElements.getName(component.constructor as CustomElementConstructor)}" />`;
  }

  return `<${tagName} />`;
}
