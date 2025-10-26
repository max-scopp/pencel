import { filterMap } from "@pencel/utils";
import {
  type ClassDeclaration,
  isClassDeclaration,
  type SourceFile,
} from "typescript";
import { ComponentIR } from "./component.ts";
import { IRM, IRRef } from "./ref.ts";

export class FileIR extends IRM("File") {
  readonly fileName: string;
  readonly components: IRRef<ComponentIR, ClassDeclaration>[];

  constructor(sourceFile: SourceFile) {
    super();

    this.fileName = sourceFile.fileName;

    this.components = filterMap(sourceFile.statements, (statement) => {
      if (isClassDeclaration(statement)) {
        return new IRRef(new ComponentIR(sourceFile, statement), statement);
      }

      return;
    });
  }
}
