import { inject } from "../core/container.ts";
import { IR } from "../ir/ir.ts";

export class ComponentDeclarationsFactory {
  readonly ir: IR = inject(IR);
}
