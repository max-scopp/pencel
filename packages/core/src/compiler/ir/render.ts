import type { MethodDeclaration } from "typescript";
import { IRM } from "./irri.ts";

/**
 * Minimal RenderIR class for IRRef<RenderIR, MethodDeclaration> compatibility.
 * No parsing logic - the actual JSX transformation happens in RenderTransformer.
 */
export class RenderIR extends IRM("Render") {
  constructor(_renderMember: MethodDeclaration) {
    super();
    // No logic - just exists for IRRef compatibility with the transformer
  }
}
