import { basename, dirname, relative, resolve } from "node:path";
import { ConsumerError } from "@pencel/utils";
import type ts from "typescript";
import type { PencelContext } from "../types/compiler-types.ts";

export function getOutputPathForSource(
  sf: ts.SourceFile,
  ctx: PencelContext,
): string {
  const newBase = getOutputBasePath(ctx);

  switch (ctx.config.output.mode) {
    case "aside": {
      const absDir = dirname(resolve(newBase, sf.fileName));
      return resolve(
        absDir,
        basename(sf.fileName).replace(...ctx.config.output.replace),
      );
    }

    case "folder": {
      // Calculate the relative path from the project root to maintain directory structure
      const relativePath = relative(ctx.cwd, sf.fileName);
      return resolve(newBase, relativePath);
    }

    default:
      throw new ConsumerError("Invalid output mode");
  }
}

export function getOutputBasePath(ctx: PencelContext): string {
  switch (ctx.config.output.mode) {
    case "aside": {
      return ctx.cwd;
    }

    case "folder": {
      return resolve(ctx.cwd, ctx.config.output.path);
    }

    default:
      throw new ConsumerError("Invalid output mode");
  }
}
