import { inject } from "../core/container.ts";
import { IR } from "../ir/ir.ts";

export class ComponentDeclarations {
  readonly ir: IR = inject(IR);

  generateGlobalDeclaration(): string {
    const componentDecls = this.ir.components.map((component) => {
      const props = component.properties
        .filter((p) => p.decoratorType === "Prop")
        .map((p) => `    ${p.name}${p.isRequired ? "" : "?"}: ${p.type};`)
        .join("\n");

      const propsInterface = props
        ? `\n  interface ${component.className}Element extends HTMLElement {\n${props}\n  }\n`
        : "";

      return `${propsInterface}
  declare global {
    interface HTMLElementTagNameMap {
      '${component.tag}': ${component.className}Element${props ? "" : " & HTMLElement"};
    }
  }`;
    });

    return componentDecls.join("\n\n");
  }
}
