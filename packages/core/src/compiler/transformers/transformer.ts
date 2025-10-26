import type { Node } from "typescript";
import type { IR, IRRef } from "../ir/irri.ts";

export abstract class Transformer {
  abstract transform(irr: IRRef<IR, Node>): void;
}
