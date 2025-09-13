import type { PropOptions } from "@pencel/runtime";
import * as ts from "typescript";
import type {
  ComponentMetadata,
  PencilConfig,
} from "../types/compiler-types.ts";
import {
  findClassWithDecorator,
  getComponentDecoratorOptions,
} from "../utils/ast-utils.ts";

// TODO: Implement
export interface PencilComponentPropMetadata {
  name: string | symbol;
  staticType?: string;
}

// TODO: Implement
export interface PencilComponentMetadata {
  tagName: string;
  className: string;

  props: Map<string, PencilComponentPropMetadata>;
  states: string[];
  // Add more metadata fields as needed
}

export function analyzeComponent(
  sourceFile: ts.SourceFile,
  config?: PencilConfig,
): ComponentMetadata | null {
  const classNode = findClassWithDecorator(sourceFile, "Component");
  if (!classNode) return null;

  const metadata: ComponentMetadata = {};

  // Extract decorator options
  const decoratorOptions = getComponentDecoratorOptions(classNode);
  if (
    decoratorOptions?.tagName &&
    typeof decoratorOptions.tagName === "string"
  ) {
    metadata.tagName = decoratorOptions.tagName;
  } else {
    // Fallback to class name as tag name (simple convention)
    if (classNode.name) {
      metadata.tagName = classNode.name.text.toLowerCase();
    }
  }

  // Apply tag namespace from config
  if (config?.tagNamespace && metadata.tagName) {
    metadata.tagName = config.tagNamespace + metadata.tagName;
  }

  // Check if it extends HTMLElement or similar
  if (classNode.heritageClauses) {
    for (const clause of classNode.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        for (const type of clause.types) {
          if (ts.isIdentifier(type.expression)) {
            metadata.extends = type.expression.text;
          }
        }
      }
    }
  }

  return metadata;
}
