import { type Node, type SourceFile, type TransformerFactory, transform, visitEachChild } from "typescript";
import { FileIR } from "../ir/file.ts";
import { type IR, IRRef, IRRI } from "../ir/irri.ts";
import { ComponentTransformer } from "../transformers/component.ts";
import { FileTransformer } from "../transformers/file.ts";
import { PropertyTransformer } from "../transformers/props.ts";
import { RenderTransformer } from "../transformers/render.ts";
import type { ITransformer } from "../transformers/transformer.ts";
import { isPencelGeneratedFile } from "../utils/marker.ts";
import { inject } from "./container.ts";
import { Plugins } from "./plugin.ts";
import { SourceFiles } from "./source-files.ts";

export class FileProcessor {
  #irri = inject(IRRI);
  #sourceFiles = inject(SourceFiles);
  #transformers = [
    inject(RenderTransformer),
    inject(ComponentTransformer),
    inject(PropertyTransformer),
    inject(FileTransformer),
  ];

  readonly plugins: Plugins = inject(Plugins);

  async process(sourceFile: SourceFile): Promise<IRRef<FileIR, SourceFile> | null> {
    if (!this.shouldProcess(sourceFile)) {
      return null;
    }

    // Create FileIR asynchronously to process all component styles
    const file = await FileIR.create(sourceFile);
    const fileIrr = new IRRef(file, sourceFile);

    // Apply AST transformations based on IR
    // Symbols will be automatically rescanned and updated in SourceFiles.setStatements()
    this.visitAndTransform([fileIrr]);

    // Let plugins derive framework-specific outputs
    await this.plugins.handle({
      hook: "derive",
      irr: fileIrr,
    });

    return fileIrr;
  }

  shouldProcess(sourceFile: SourceFile): boolean {
    // Don't touch our own generated files
    if (isPencelGeneratedFile(sourceFile)) {
      return false;
    }

    return true;
  }
  /**
   * Traverses AST nodes and applies transformers based on IR type.
   * Keeps TypeScript AST and IR registry in sync.
   */
  visitAndTransform(fileIrrs: Array<IRRef<FileIR, SourceFile>>): SourceFile[] {
    const visit = (node: Node): Node => {
      const irr = this.#irri.getIrrForNode(node);

      let transformedNode: Node;
      if (irr) {
        const transformer = this.#transformers.find((t) => irr.ir instanceof t.forIr) as ITransformer<Node, IR>;

        if (transformer) {
          transformedNode = transformer.transform(irr);
        } else {
          transformedNode = visitEachChild(node, visit, undefined);
        }
      } else {
        transformedNode = visitEachChild(node, visit, undefined);
      }

      if (transformedNode !== node) {
        this.#irri.updateNode(node, transformedNode);
      }

      return transformedNode;
    };

    const factory: TransformerFactory<SourceFile> = () => (sourceFile) => visit(sourceFile) as SourceFile;

    const result = transform(
      fileIrrs.map((irr) => irr.node),
      [factory],
    );

    const transformedFiles = result.transformed as SourceFile[];

    fileIrrs.forEach((fileIrr, index) => {
      const transformedFile = transformedFiles[index];
      if (transformedFile !== fileIrr.node) {
        fileIrr.node = transformedFile;
      }
    });

    transformedFiles.forEach((file) => {
      this.#sourceFiles.setStatements(file, file.statements);
    });

    return transformedFiles;
  }
}
