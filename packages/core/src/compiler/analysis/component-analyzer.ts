import type { ComponentOptions } from "@pencel/runtime";
import { throwError } from "@pencel/utils";
import {
  computeConstructorType,
  computeTypeAsString,
  extractDecoratorInfo,
  findClasses,
  findDecorators,
  findProperties,
  nodeToString,
  type ProgramBuilder,
} from "ts-flattered";
import type ts from "typescript";
import { compilerTree } from "../core/compiler.ts";
import type {
  PencilComponentMetadata,
  PencilComponentPropMetadata,
} from "../types/compiler-types.ts";
import type { PencelConfig } from "../types/config-types.ts";

export async function extractMetaFromFile(
  program: ts.Program & ProgramBuilder,
  relativePath: string,
  _config: PencelConfig,
): Promise<PencilComponentMetadata[]> {
  const sourceFile =
    program.getSourceFile(relativePath) ?? throwError("No source file");

  compilerTree.start("find-classes");
  const klasses = findClasses(sourceFile);
  compilerTree.end("find-classes");

  const metas: PencilComponentMetadata[] = [];

  if (klasses.length === 0) {
    return metas;
  }

  compilerTree.start(`analyze-${klasses.length}-classes`);

  for (const klass of klasses) {
    const decos = findDecorators(klass, {
      sourceFile,
      name: "Component",
      module: "@pencel/runtime",
    });

    for (const deco of decos) {
      const info = extractDecoratorInfo(deco);
      const firstArgOfComponentDecorator = info?.arguments.at(0) as
        | ComponentOptions
        | undefined;

      const meta: PencilComponentMetadata = {
        className: klass.name?.text ?? throwError("Unnamed class"),
        tagName: firstArgOfComponentDecorator?.tag,
        states: getComponentStates(sourceFile, klass),
        props: getComponentProps(program, sourceFile, klass),
        styles: {
          defaultUrl: firstArgOfComponentDecorator?.styleUrl,
          modeUrls: firstArgOfComponentDecorator?.styleUrls,
          inline:
            typeof firstArgOfComponentDecorator?.styles === "string"
              ? [firstArgOfComponentDecorator?.styles]
              : firstArgOfComponentDecorator?.styles,
        },
      };

      metas.push(meta);
    }
  }

  compilerTree.end(`analyze-${klasses.length}-classes`);

  return metas;
}

export function getComponentStates(
  sourceFile: ts.SourceFile,
  klass: ts.ClassDeclaration,
): string[] {
  return findProperties(klass, {
    sourceFile,
    decorators: {
      name: "State",
      module: "@pencel/runtime",
    },
  }).map((propertyDecl) => {
    return nodeToString(propertyDecl.name, sourceFile);
  });
}

export function getComponentProps(
  program: ts.Program,
  sourceFile: ts.SourceFile,
  klass: ts.ClassDeclaration,
): Map<string, PencilComponentPropMetadata> {
  const props = new Map<string, PencilComponentPropMetadata>();

  for (const propDecl of findProperties(klass, {
    sourceFile,
    decorators: {
      name: "Prop",
      module: "@pencel/runtime",
    },
  })) {
    const propName = nodeToString(propDecl.name, sourceFile);

    props.set(propName, {
      computedType: computeTypeAsString(
        program.getTypeChecker(),
        propDecl.type ?? propDecl.initializer,
        sourceFile,
      ),
      coerce: computeConstructorType(
        program.getTypeChecker(),
        propDecl.type ?? propDecl.initializer,
      ),
    });
  }

  return props;
}
