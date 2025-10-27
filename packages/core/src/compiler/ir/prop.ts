import type { PropOptions } from "@pencel/runtime";
import { throwError } from "@pencel/utils";
import type { ClassElement, PropertyDeclaration } from "typescript";
import { isPropertyDeclaration } from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import type { ASTNode } from "../../ts-utils/node.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { IRM } from "./irri.ts";

export class PropertyIR extends IRM("Prop") {
  readonly attr?: string | ASTNode | null;
  readonly name?: ASTNode | null;
  readonly type: string;
  readonly isRequired: boolean;
  readonly defaultValue?: string;

  constructor(propertyDeclaration: PropertyDeclaration) {
    super();

    const decorator = singleDecorator(propertyDeclaration, "Prop");
    const [propOptions = {}] =
      decoratorArgs<readonly [PropOptions]>(decorator) ??
      throwError("@Prop must have arguments");

    this.name = propOptions.type;
    this.attr = propOptions.attr;

    this.type = propertyDeclaration.type
      ? propertyDeclaration.type.getText()
      : "any";
    this.isRequired = !!propertyDeclaration.questionToken === false;
    if (propertyDeclaration.initializer) {
      this.defaultValue = propertyDeclaration.initializer.getText();
    }
  }

  static isPencelPropMember(
    member: ClassElement,
  ): member is PropertyDeclaration {
    if (isPropertyDeclaration(member)) {
      try {
        singleDecorator(member, "Prop");
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}
