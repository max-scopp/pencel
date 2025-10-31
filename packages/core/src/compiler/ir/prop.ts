import type { PropOptions } from "@pencel/runtime";
import { dashCase, throwError } from "@pencel/utils";
import type { ClassElement, PropertyDeclaration } from "typescript";
import { isPropertyDeclaration } from "typescript";
import { decoratorArgs } from "../../ts-utils/decoratorArgs.ts";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { IRM } from "./irri.ts";

/**
 * PropertyIR is the flat IR representation of a @Prop-decorated property.
 * Contains both user-provided options and compiler-resolved metadata as public readonly fields.
 */
export class PropertyIR extends IRM("Prop") {
  // User-provided fields from @Prop decorator
  readonly attr: string;
  readonly name: string;

  readonly reflect: boolean;
  readonly mutable: boolean;

  readonly fallbackValue?: unknown;

  // Compiler-resolved metadata (flat, alongside user fields)
  readonly tsType: string;
  readonly isRequired: boolean;
  readonly defaultValue?: string;

  constructor(propertyDeclaration: PropertyDeclaration) {
    super();

    const decorator = singleDecorator(propertyDeclaration, "Prop");
    const [propOptions = {}] =
      decoratorArgs<readonly [PropOptions]>(decorator) ??
      throwError("@Prop must have arguments");

    this.name = propertyDeclaration.name.getText();
    this.attr = propOptions.attr ?? dashCase(this.name);

    this.reflect = propOptions.reflect ?? false;
    this.mutable = propOptions.mutable ?? true;

    this.fallbackValue = propOptions.fallbackValue;

    this.tsType = propertyDeclaration.type?.getText() ?? "any";
    this.isRequired = !propertyDeclaration.questionToken;
    this.defaultValue = propertyDeclaration.initializer?.getText();
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
