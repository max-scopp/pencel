import type ts from "typescript";
import { ComponentTypings } from "../codegen/component-typings.ts";
import { FileIR } from "../ir/file.ts";
import { IRRef } from "../ir/irri.ts";
import { FileTransformer } from "../transformers/file.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { inject } from "./container.ts";
import { Plugins } from "./plugin.ts";

export class FileProcessor {
  readonly plugins: Plugins = inject(Plugins);

  readonly componentTypings: ComponentTypings = inject(ComponentTypings);

  #fileTransformer = inject(FileTransformer);

  async process(sourceFile: ts.SourceFile): Promise<FileIR | null> {
    if (!this.shouldProcess(sourceFile)) {
      return null;
    }

    const file = new FileIR(sourceFile);
    this.#fileTransformer.transform(new IRRef(file, sourceFile));

    await this.componentTypings.createTypings(sourceFile);

    await this.plugins.handle({
      hook: "codegen",
      input: sourceFile,
    });

    return file;
  }

  shouldProcess(sourceFile: ts.SourceFile): boolean {
    // Don't touch our own generated files
    if (isPencelGeneratedFile(sourceFile)) {
      return false;
    }

    return true;
  }
}
