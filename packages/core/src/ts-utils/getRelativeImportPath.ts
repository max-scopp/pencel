import { dirname, relative } from "node:path";

/**
 * Compute a relative import path from one file to another, normalized for ES modules.
 * Removes .ts/.tsx extensions and ensures path starts with ./ or ../
 */
export function getRelativeImportPath(
  fromPath: string,
  toPath: string,
): string {
  let rel = relative(dirname(fromPath), toPath);
  // Normalize to use forward slashes and remove .ts/.tsx extension
  rel = rel.replace(/\\/g, "/").replace(/\.tsx?$/, "");
  // Ensure it starts with ./ or ../
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel;
}
