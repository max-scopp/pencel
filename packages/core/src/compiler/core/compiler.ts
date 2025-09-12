import { transformComponent } from "../transforms/component-transform";
import type { PencilConfig, TransformResult } from "../types/compiler-types";

export function transformToWebComponent(
  fileContents: string,
  config?: PencilConfig,
): TransformResult {
  return transformComponent(fileContents, config);
}
