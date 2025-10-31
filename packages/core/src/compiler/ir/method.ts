import { createWarn } from "@pencel/utils";
import {
  type ClassElement,
  isMethodDeclaration,
  type MethodDeclaration,
  SyntaxKind,
} from "typescript";
import { singleDecorator } from "../../ts-utils/singleDecorator.ts";
import { IRM } from "./irri.ts";

const warn = createWarn("MethodIR");

/**
 * MethodIR is the flat IR representation of a public method.
 * Contains compiler-resolved metadata as public readonly fields.
 *
 * MethodIR = { name, returnType }
 *
 * The IR is the single source of truth. Transformers extract a subset as [INTERNALS].
 */
export class MethodIR extends IRM("Method") {
  // Compiler-resolved metadata (methods are implicitly public, no user options)
  readonly name: string;
  readonly returnType?: string;

  constructor(methodDeclaration: MethodDeclaration) {
    super();

    // Store compiler-resolved metadata directly as public fields
    this.name = methodDeclaration.name.getText();
    this.returnType = methodDeclaration.type?.getText();
  }

  static isPencelMethodMember(
    member: ClassElement,
  ): member is MethodDeclaration {
    if (!isMethodDeclaration(member)) {
      return false;
    }

    try {
      singleDecorator(member, "Method");
      warn(
        `Decorating ${member.getText()} with @Method is not necessary. All public methods are accessible by nature.`,
      );
    } catch {
      // Decorator not found, which is fine
    }

    // Check if method is public (not protected, private, or #private)
    const hasProtected = member.modifiers?.some(
      (m) => m.kind === SyntaxKind.ProtectedKeyword,
    );

    const hasPrivate = member.modifiers?.some(
      (m) => m.kind === SyntaxKind.PrivateKeyword,
    );

    const isPrivateName = member.name?.kind === SyntaxKind.PrivateIdentifier;

    return !hasProtected && !hasPrivate && !isPrivateName;
  }
}
