import { createWarn } from "@pencel/utils";
import {
  type ClassElement,
  isMethodDeclaration,
  type MethodDeclaration,
} from "typescript";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { IRM } from "./ref.ts";

const warn = createWarn("MethodIR");

export class MethodIR extends IRM("Method") {
  name: string;
  returnType?: string;

  constructor(methodDeclaration: MethodDeclaration) {
    super();

    this.name = methodDeclaration.name.getText();
    this.returnType = methodDeclaration.type?.getText();
  }

  static isPencelMethodMember(
    member: ClassElement,
  ): member is MethodDeclaration {
    if (isMethodDeclaration(member)) {
      try {
        singleDecorator(member, "Method");

        warn(
          `Decorating ${member.getText()} with @Method is not necessary. All non-private elements are accessible by nature.`,
        );

        return true;
      } catch {
        return true;
      }
    }

    return false;
  }
}
