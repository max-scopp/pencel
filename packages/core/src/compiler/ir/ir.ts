import type ts from "typescript";
import type { ComponentIR } from "./component-ir.ts";

export class IR {
  readonly components: ComponentIR[] = [];

  getComponentByTag(tag: string): ComponentIR | undefined {
    return this.components.find((component) => component.tag === tag);
  }

  getComponentByClassName(className: string): ComponentIR | undefined {
    return this.components.find(
      (component) => component.className === className,
    );
  }

  getIRsForSourceFile(sourceFile: ts.SourceFile): ComponentIR[] {
    return this.components.filter(
      (component) => component.sourceFile === sourceFile,
    );
  }
}
