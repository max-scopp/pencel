import type { SourceFile } from "typescript";
import { Config } from "../config.ts";
import { inject } from "../core/container.ts";
import { FileIR } from "../ir/file.ts";
import type { IRRef } from "../ir/ref.ts";
import { replaceQualifier } from "../utils/replaceQualifier.ts";
import { ComponentTransformer } from "./component.ts";
import { Transformer } from "./transformer.ts";

export class FileTransformer extends Transformer(FileIR) {
  #config = inject(Config);
  #componentTransformer = inject(ComponentTransformer);

  override transform(irr: IRRef<FileIR, SourceFile>) {
    replaceQualifier(
      irr.node.fileName,
      this.#config.user.output.inputQualifier,
      this.#config.user.output.outputQualifier,
    );

    irr.ir.components.forEach((cirr) => {
      this.#componentTransformer.transform(cirr);
    });
  }
}
