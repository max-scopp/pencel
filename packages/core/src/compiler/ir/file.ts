import type { ComponentOptions } from "@pencel/runtime";
import { filterMap, throwError } from "@pencel/utils";
import {
  type ClassDeclaration,
  isClassDeclaration,
  type SourceFile,
} from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { ComponentIR } from "./component.ts";
import { IRM, IRRef } from "./irri.ts";
import { StyleIR } from "./style.ts";

export class FileIR extends IRM("File") {
  /** Absolute path to the source file */
  readonly fileName: string;

  /** All components defined in this file with their processed styles */
  readonly components: IRRef<ComponentIR, ClassDeclaration>[];

  /**
   * Private constructor for factory pattern.
   * Use FileIR.create() to construct a FileIR with fully processed styles.
   */
  private constructor(
    sourceFile: SourceFile,
    components: IRRef<ComponentIR, ClassDeclaration>[],
  ) {
    super();
    this.fileName = sourceFile.fileName;
    this.components = components;
  }

  /**
   * Async factory method to create a FileIR with fully processed styles.
   * Processes styles for all components before constructing ComponentIRs.
   *
   * @param sourceFile - TypeScript source file
   * @returns FileIR instance with all components' styles processed
   */
  static async create(sourceFile: SourceFile): Promise<FileIR> {
    // First pass: collect all class declarations with their component options
    const classDeclarationsWithOptions = filterMap(
      sourceFile.statements,
      (statement) => {
        if (isClassDeclaration(statement)) {
          // Extract component options from @Component decorator
          const decorator = singleDecorator(statement, "Component");
          const [componentOptions] =
            decoratorArgs<readonly [ComponentOptions]>(decorator) ??
            throwError(`@Component decorator must have options object.`);

          return { classDeclaration: statement, componentOptions };
        }

        return;
      },
    );

    // Second pass: process styles and create ComponentIRs in parallel
    const componentIRs = await Promise.all(
      classDeclarationsWithOptions.map(
        async ({ classDeclaration, componentOptions }) => {
          // Process styles asynchronously (SCSS compilation, minification, etc.)
          const processedStyles = await StyleIR.process(
            sourceFile,
            componentOptions,
          );

          // Then construct ComponentIR with processed styles
          const componentIR = new ComponentIR(
            sourceFile,
            classDeclaration,
            processedStyles,
          );
          return new IRRef(componentIR, classDeclaration);
        },
      ),
    );

    return new FileIR(sourceFile, componentIRs);
  }
}
