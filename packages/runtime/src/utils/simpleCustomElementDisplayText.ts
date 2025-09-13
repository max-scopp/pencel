import {
  type ComponentInterface,
  PENCIL_COMPONENT_CONTEXT,
} from "src/controllers/component.ts";

export function simpleCustomElementDisplayText(
  component: ComponentInterface,
): string {
  const extnds = component[PENCIL_COMPONENT_CONTEXT]?.extends;
  const tagName = component.tagName.toLowerCase();

  if (extnds) {
    return `<${extnds} is="${customElements.getName(component.constructor as CustomElementConstructor)}" />`;
  }

  return `<${tagName} />`;
}
