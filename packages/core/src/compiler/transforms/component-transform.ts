import { analyzeComponent } from "../analysis/component-analyzer";
import { generateComponentRegistration } from "../codegen/component-codegen";
import type { PencilConfig, TransformResult } from "../types/compiler-types";
import { createSourceFile, findClassWithDecorator } from "../utils/ast-utils";

export function transformComponent(
  fileContents: string,
  config?: PencilConfig,
): TransformResult {
  const sourceFile = createSourceFile(fileContents);
  const classNode = findClassWithDecorator(sourceFile, "Component");

  if (!classNode) {
    return {
      code: fileContents,
      metadata: {},
    };
  }

  const metadata = analyzeComponent(sourceFile, config);
  if (!metadata) {
    return {
      code: fileContents,
      metadata: {},
    };
  }

  const className = classNode.name?.text;
  if (!className) {
    return {
      code: fileContents,
      metadata: {},
    };
  }

  // Generate the registration code
  const registrationCode = generateComponentRegistration(metadata, className);

  // Append the registration code to the original file contents
  const transformedCode = fileContents + "\n\n" + registrationCode;

  return {
    code: transformedCode,
    metadata,
  };
}
