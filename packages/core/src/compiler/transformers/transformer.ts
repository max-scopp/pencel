import type { Node } from "typescript";
import type { IR, IRRef } from "../ir/ref.ts";

export interface ITransformer {
  shouldHandle(irr: IRRef<IR, Node>): boolean;
  transform(irr: IRRef<IR, Node>): void;
}
export function Transformer<TIR extends IR>(forIr: {
  new (...args: any[]): TIR;
}) {
  return class implements ITransformer {
    shouldHandle(irr: IRRef<IR, Node>) {
      return irr.ir instanceof forIr;
    }

    transform(irr: IRRef<IR, Node>) {
      throw new Error("transform() must be implemented.");
    }
  };
}
