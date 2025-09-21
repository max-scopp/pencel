import { inject } from "../core/container.ts";
import { SourceFileFactory } from "../factories/source-file-factory.ts";
import type { ComponentIR } from "./component-ir.ts";

export class IR {
  readonly components: ComponentIR[] = [];

  readonly sourceFileFactory: SourceFileFactory = inject(SourceFileFactory);

  getComponentByTag(tag: string): ComponentIR | undefined {
    return this.components.find((component) => component.tag === tag);
  }

  getComponentByClassName(className: string): ComponentIR | undefined {
    return this.components.find(
      (component) => component.className === className,
    );
  }
}
