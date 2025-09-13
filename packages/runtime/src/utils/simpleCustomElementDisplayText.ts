import { PENCIL_COMPONENT_CONTEXT } from "src/controllers/component.ts";
import type { ComponentInterfaceWithContext } from "src/core/types.ts";

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
