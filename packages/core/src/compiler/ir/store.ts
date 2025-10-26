import type ts from "typescript";
import type { ComponentIR } from "./component.ts";

/**
 * @deprecated use FileIR
 */
export class StoreIR {
  /**
   * @deprecated use FileIR
   */
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
      (component) => component.fileName === sourceFile.fileName,
    );
  }
}
