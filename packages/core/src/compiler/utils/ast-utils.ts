import * as ts from "typescript";

export function createSourceFile(
  fileContents: string,
  fileName = "temp.ts",
): ts.SourceFile {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  };

  // Use TypeScript's built-in createCompilerHost for a complete, working host
  const host = ts.createCompilerHost(compilerOptions);

  // Override only the methods we need for string-based source files
  const originalReadFile = host.readFile;
  const originalFileExists = host.fileExists;
  const originalGetSourceFile = host.getSourceFile;

  host.readFile = (fileName: string) => {
    if (fileName === "temp.ts") {
      return fileContents;
    }
    return originalReadFile(fileName);
  };

  host.fileExists = (fileName: string) => {
    if (fileName === "temp.ts") {
      return true;
    }
    return originalFileExists(fileName);
  };

  host.getSourceFile = (
    fileName: string,
    languageVersion: ts.ScriptTarget,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean,
  ) => {
    if (fileName === "temp.ts") {
      return ts.createSourceFile(fileName, fileContents, languageVersion);
    }
    return originalGetSourceFile(
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
    );
  };

  const program = ts.createProgram([fileName], compilerOptions, host);
  const sourceFile = program.getSourceFile(fileName);
  if (!sourceFile) {
    throw new Error("Failed to create source file");
  }
  return sourceFile;
}

export function findClassWithDecorator(
  sourceFile: ts.SourceFile,
  decoratorName: string,
): ts.ClassDeclaration | undefined {
  function visit(node: ts.Node): ts.ClassDeclaration | undefined {
    if (ts.isClassDeclaration(node) && hasDecorator(node, decoratorName)) {
      return node;
    }
    return ts.forEachChild(node, visit);
  }
  return visit(sourceFile);
}

export function hasDecorator(
  node: ts.ClassDeclaration,
  decoratorName: string,
): boolean {
  const decorators = ts.getDecorators(node);
  if (!decorators) return false;
  return decorators.some((decorator) => {
    const isCall = ts.isCallExpression(decorator.expression);
    if (isCall) {
      const isId = ts.isIdentifier(decorator.expression.expression);
      if (isId) {
        return decorator.expression.expression.text === decoratorName;
      }
    }
    return false;
  });
}

function parseObjectLiteral(
  obj: ts.ObjectLiteralExpression,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      const key = prop.name.text;
      const value = prop.initializer;

      if (ts.isStringLiteral(value)) {
        result[key] = value.text;
      } else if (ts.isNumericLiteral(value)) {
        result[key] = Number(value.text);
      } else if (value.kind === ts.SyntaxKind.TrueKeyword) {
        result[key] = true;
      } else if (value.kind === ts.SyntaxKind.FalseKeyword) {
        result[key] = false;
      }
    }
  }

  return result;
}

export function getDecoratorArgs(decorator: ts.Decorator): unknown[] {
  if (ts.isCallExpression(decorator.expression)) {
    return decorator.expression.arguments.map((arg) => {
      if (ts.isStringLiteral(arg)) {
        return arg.text;
      }
      if (ts.isObjectLiteralExpression(arg)) {
        return parseObjectLiteral(arg);
      }
      return undefined;
    });
  }
  return [];
}

export function getComponentDecoratorOptions(
  node: ts.ClassDeclaration,
): Record<string, unknown> | null {
  const decorators = ts.getDecorators(node);
  if (!decorators) return null;

  for (const decorator of decorators) {
    if (ts.isCallExpression(decorator.expression)) {
      const expression = decorator.expression.expression;
      if (ts.isIdentifier(expression) && expression.text === "Component") {
        const args = getDecoratorArgs(decorator);
        if (args.length > 0 && typeof args[0] === "object") {
          return args[0] as Record<string, unknown>;
        }
      }
    }
  }

  return null;
}
