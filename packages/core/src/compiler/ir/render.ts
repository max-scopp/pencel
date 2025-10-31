import type { MethodDeclaration } from "typescript";
import { IRM } from "./irri.ts";

/**
 * Minimal RenderIR for IRRef<RenderIR, MethodDeclaration> compatibility; JSX transformation happens in RenderTransformer.
 */
export class RenderIR extends IRM("Render") {
  constructor(_renderMember: MethodDeclaration) {
    super();
  }
}
