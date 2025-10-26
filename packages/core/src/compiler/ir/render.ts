import { IRM } from "./ref.ts";

/**
 * Converts the JSX into an IR so it can be rewritten to patch logic.
 */
export class RenderIR extends IRM("Render") {}
