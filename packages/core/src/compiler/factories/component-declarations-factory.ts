import { inject } from "../core/container.ts";
import { ComponentIRBuilder } from "../ir/component-ir-builder.ts";

export class ComponentDeclarationsFactory {
  readonly ir: ComponentIRBuilder = inject(ComponentIRBuilder);
}
