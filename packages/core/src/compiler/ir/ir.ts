import { inject } from "../core/container.ts";
import { SourceFiles } from "../factories/source-files.ts";
import type { ComponentIR } from "./component-ir.ts";

export class IR {
  readonly components: ComponentIR[] = [];

  readonly sourceFileFactory: SourceFiles = inject(SourceFiles);

  getComponentByTag(tag: string): ComponentIR | undefined {
    return this.components.find((component) => component.tag === tag);
  }

  getComponentByClassName(className: string): ComponentIR | undefined {
    return this.components.find(
      (component) => component.className === className,
    );
  }
}
