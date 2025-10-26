import {
  type Node,
  type SourceFile,
  type TransformerFactory,
  transform,
  visitEachChild,
} from "typescript";
import { FileIR } from "../ir/file.ts";
import { type IR, IRRef, IRRI } from "../ir/irri.ts";
import { ComponentTransformer } from "../transformers/component.ts";
import { FileTransformer } from "../transformers/file.ts";
import { PropertyTransformer } from "../transformers/props.ts";
import type { ITransformer } from "../transformers/transformer.ts";
import { inject } from "./container.ts";
import { Plugins } from "./plugin.ts";
import { SourceFiles } from "./source-files.ts";

export class FileProcessor {
  #irri = inject(IRRI);
  #sourceFiles = inject(SourceFiles);
  #transformers = [
    inject(FileTransformer),
    inject(ComponentTransformer),
    inject(PropertyTransformer),
  ];

  readonly plugins: Plugins = inject(Plugins);

  async process(
    sourceFile: SourceFile,
  ): Promise<IRRef<FileIR, SourceFile> | null> {
    if (!this.shouldProcess(sourceFile)) {
      return null;
    }

    const file = new FileIR(sourceFile);
    const fileIrr = new IRRef(file, sourceFile);

    await this.plugins.handle({
      hook: "transform",
      irr: fileIrr,
    });

    this.visitAndTransform([fileIrr]);
    this.#sourceFiles.setStatements(fileIrr.node, [...fileIrr.node.statements]);

    await this.plugins.handle({
      hook: "derive",
      irr: fileIrr,
    });

    return fileIrr;
  }

  shouldProcess(_sourceFile: SourceFile): boolean {
    // // Don't touch our own generated files
    // if (isPencelGeneratedFile(sourceFile)) {
    //   return false;
    // }

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
        const transformer = this.#transformers.find(
          (t) => irr.ir instanceof t.forIr,
        ) as ITransformer<Node, IR>;

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

    const factory: TransformerFactory<SourceFile> = () => (sourceFile) =>
      visit(sourceFile) as SourceFile;

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

    return transformedFiles;
  }
}
