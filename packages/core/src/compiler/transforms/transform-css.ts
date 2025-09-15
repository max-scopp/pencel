import { createLog } from "@pencel/utils";
import type ts from "typescript";

const log = createLog("CSS Processor");

export function processCss(
  sourceFile: ts.SourceFile,
  cssSourceText: string,
): Promise<string> {
  log(`Transform ${sourceFile.fileName}`);

  return cssSourceText.replace(/\/\*[\s\S]*?\*\//g, "").trim();
}
