import type { StateOptions } from "@pencel/runtime";
import { throwError } from "@pencel/utils";
import type { ClassElement, PropertyDeclaration } from "typescript";
import { isPropertyDeclaration } from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import type { ASTNode } from "../../ts-utils/node.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { IRM } from "./irri.ts";

export class StateIR extends IRM("State") {
  readonly name: string;

  readonly eqal?: ASTNode;

  readonly tsType: string;
  readonly isRequired: boolean;
  readonly defaultValue?: string;

  constructor(propertyDeclaration: PropertyDeclaration) {
    super();

    const decorator = singleDecorator(propertyDeclaration, "State");
    const [stateOptions = {}] =
      decoratorArgs<readonly [StateOptions]>(decorator) ??
      throwError("@State must have arguments");

    this.name = propertyDeclaration.name.getText();

    this.eqal = stateOptions.equal;

    this.tsType = propertyDeclaration.type?.getText() ?? "any";
    this.isRequired = !propertyDeclaration.questionToken;
    this.defaultValue = propertyDeclaration.initializer?.getText();
  }

  static isPencelStateMember(
    member: ClassElement,
  ): member is PropertyDeclaration {
    if (isPropertyDeclaration(member)) {
      try {
        singleDecorator(member, "State");
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}
