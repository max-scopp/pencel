import type { SourceFile } from "typescript";
import { factory } from "typescript";
import { Config } from "../config.ts";
import { inject } from "../core/container.ts";
import { FileIR } from "../ir/file.ts";
import type { IRRef } from "../ir/irri.ts";
import { replaceQualifier } from "../utils/replaceQualifier.ts";
import { ComponentTransformer } from "./component.ts";
import { Transformer } from "./transformer.ts";

export class FileTransformer extends Transformer(FileIR) {
  #config = inject(Config);
  #componentTransformer = inject(ComponentTransformer);

  override transform(irr: IRRef<FileIR, SourceFile>) {
    irr.node.fileName = replaceQualifier(
      irr.node.fileName,
      this.#config.user.output.qualifier,
      this.#config.user.output.qualifier,
    );

    let statementsChanged = false;
    const newStatements = irr.node.statements.map((stmt) => {
      // Find the corresponding component IR
      const componentIrr = irr.ir.components.find((c) => c.node === stmt);
      if (!componentIrr) return stmt;

      const updatedNode = this.#componentTransformer.transform(componentIrr);
      // Update the node reference if it changed
      if (updatedNode !== componentIrr.node) {
        componentIrr.node = updatedNode;
        statementsChanged = true;
      }
      return updatedNode;
    });

    // If any statements changed, create a new SourceFile with updated statements
    if (statementsChanged) {
      return factory.updateSourceFile(irr.node, newStatements);
    }

    return irr.node;
  }
}
