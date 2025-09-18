import type { SourceFile } from "ts-flattered";
import { ComponentIR } from "./component-ir.ts";

export class ComponentIRBuilder {
  private components: ComponentIR[] = [];

  createFromSourceFile(sourceFile: SourceFile): ComponentIR {
    return new ComponentIR(sourceFile);
  }

  registerComponent(componentIR: ComponentIR): void {
    // Ensure component is finalized before registration
    componentIR.finalize();
    this.components.push(componentIR);
  }

  getAllComponents(): ComponentIR[] {
    return [...this.components];
  }

  getComponentByTag(tag: string): ComponentIR | undefined {
    return this.components.find((component) => component.tag === tag);
  }

  getComponentByClassName(className: string): ComponentIR | undefined {
    return this.components.find(
      (component) => component.className === className,
    );
  }

  generateAllDeclarations(): string {
    if (this.components.length === 0) {
      return "";
    }

    const declarations = this.components
      .map((component) => component.generateGlobalDeclaration())
      .join("\n\n");

    return `// Auto-generated component declarations\n${declarations}`;
  }

  clear(): void {
    this.components = [];
  }

  getComponentCount(): number {
    return this.components.length;
  }
}
