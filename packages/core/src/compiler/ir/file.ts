import type { ComponentOptions } from "@pencel/runtime";
import { filterMap, throwError } from "@pencel/utils";
import { type ClassDeclaration, isClassDeclaration, type SourceFile } from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { ComponentIR } from "./component.ts";
import { IRM, IRRef } from "./irri.ts";
import { StyleIR } from "./style.ts";

export class FileIR extends IRM("File") {
  readonly fileName: string;
  readonly components: IRRef<ComponentIR, ClassDeclaration>[];

  private constructor(sourceFile: SourceFile, components: IRRef<ComponentIR, ClassDeclaration>[]) {
    super();
    this.fileName = sourceFile.fileName;
    this.components = components;
  }

  /**
   * Async factory method to create FileIR with fully processed styles for all components.
   */
  static async create(sourceFile: SourceFile): Promise<FileIR> {
    // First pass: collect all class declarations with their component options
    const classDeclarationsWithOptions = filterMap(sourceFile.statements, (statement) => {
      if (isClassDeclaration(statement)) {
        // Extract component options from @Component decorator
        const decorator = singleDecorator(statement, "Component");
        const [componentOptions] =
          decoratorArgs<readonly [ComponentOptions]>(decorator) ??
          throwError(`@Component decorator must have options object.`);

        return { classDeclaration: statement, componentOptions };
      }

      return;
    });

    // Second pass: create ComponentIRs and process styles in parallel
    const componentIRs = await Promise.all(
      classDeclarationsWithOptions.map(async ({ classDeclaration, componentOptions }) => {
        // Create ComponentIR first (without styles)
        const componentIR = new ComponentIR(sourceFile, classDeclaration);
        const componentIRRef = new IRRef(componentIR, classDeclaration);

        // Then process styles with the ComponentIR reference
        const processedStyles = await StyleIR.process(sourceFile, componentOptions, componentIRRef);

        // Adopt the processed styles into the ComponentIR
        componentIR.adoptStyles(processedStyles);

        return componentIRRef;
      }),
    );

    return new FileIR(sourceFile, componentIRs);
  }
}
