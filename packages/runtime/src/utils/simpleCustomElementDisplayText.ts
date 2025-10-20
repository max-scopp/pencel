import { PENCIL_COMPONENT_CONTEXT } from "../core/symbols.ts";
import type { ComponentInterfaceWithContext } from "../core/types.ts";

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
