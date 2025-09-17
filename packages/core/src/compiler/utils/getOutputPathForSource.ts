import { ConsumerError } from "@pencel/utils";
import { basename, dirname, resolve } from "node:path";
import type ts from "typescript";
import type { PencelContext } from "../types/compiler-types.ts";

export function getOutputPathForSource(
  sf: ts.SourceFile,
  ctx: PencelContext,
): string {
  switch (ctx.config.output.mode) {
    case "aside": {
      const absDir = dirname(resolve(ctx.cwd, sf.fileName));
      return resolve(
        absDir,
        basename(sf.fileName).replace(...ctx.config.output.replace),
      );
    }

    case "folder": {
      const absDir = resolve(ctx.cwd, ctx.config.output.path);
      return resolve(absDir, sf.fileName);
    }

    default:
      throw new ConsumerError("Invalid output mode");
  }
}
