import type { ClassDeclaration } from "typescript";
import { inject } from "../core/container.ts";
import { ComponentIR } from "../ir/component.ts";
import type { IRRef } from "../ir/ref.ts";
import { PropertyTransformer } from "./props.ts";
import { Transformer } from "./transformer.ts";

export class ComponentTransformer extends Transformer(ComponentIR) {
  // #config = inject(Config);

  #propsTransformer = inject(PropertyTransformer);

  override transform(irr: IRRef<ComponentIR, ClassDeclaration>) {
    irr.ir.props.forEach((pirr) => {
      this.#propsTransformer.transform(pirr);
    });
  }
}
