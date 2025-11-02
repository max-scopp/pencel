/** biome-ignore-all lint/suspicious/noExplicitAny: constructor args */
import type { Node } from "typescript";
import type { IR, IRRef } from "../ir/irri.ts";

export interface ITransformer<TNode extends Node, TIR extends IR> {
  readonly forIr: { new (...args: any[]): TIR };
  transform(irr: IRRef<TIR, TNode>): TNode;
}

export function Transformer<TNode extends Node, TIR extends IR = IR>(forIr: any) {
  return class implements ITransformer<TNode, TIR> {
    readonly forIr = forIr;
    transform(_irr: IRRef<TIR, TNode>): TNode {
      throw new Error("Transformer must implement transform method.");
    }
  };
}
