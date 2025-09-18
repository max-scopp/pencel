import { dirname, relative, resolve } from "node:path";
import { type SourceFile, SourceFileRegistry } from "ts-flattered";
import ts from "typescript";
import type { PencelContext } from "../types/compiler-types.ts";
import { getOutputPathForSource } from "../utils/getOutputPathForSource.ts";

export class PencilSourceFileRegistry {
  private baseRegistry = new SourceFileRegistry();
  private transformedFiles = new Set<string>();
  private sourceFileMap = new Map<string, string>(); // output path -> source path
  private outputFileMap = new Map<string, string>(); // source path -> output path

  constructor(
    private program: ts.Program,
    private ctx: PencelContext,
  ) {}

  /**
   * Get the base registry for compatibility with existing code
   */
  getBaseRegistry(): SourceFileRegistry {
    return this.baseRegistry;
  }

  /**
   * Register a transformed component file
   */
  registerTransformedFile(
    sourceFile: SourceFile,
    originalSourcePath: string,
  ): void {
    const outputPath = getOutputPathForSource(
      sourceFile as ts.SourceFile,
      this.ctx,
    );

    this.transformedFiles.add(outputPath);
    this.sourceFileMap.set(outputPath, originalSourcePath);
    this.outputFileMap.set(originalSourcePath, outputPath);

    this.baseRegistry.register(sourceFile, outputPath);
  }

  /**
   * Register a regular file (passthrough from base registry)
   */
  register(sourceFile: SourceFile, filePath?: string): void {
    this.baseRegistry.register(sourceFile, filePath);
  }

  /**
   * Get all files from the registry
   */
  getAll(): Map<string, SourceFile> {
    return this.baseRegistry.getAll();
  }

  /**
   * Write only transformed files (not source files)
   */
  writeAllFiles(): Map<string, string> {
    const allFiles = this.baseRegistry.writeAllFiles();
    const transformedOnly = new Map<string, string>();

    // Only include files that are in our transformed files set
    for (const [filePath, contents] of allFiles) {
      if (this.isTransformedFile(filePath)) {
        transformedOnly.set(filePath, contents);
      }
    }

    return transformedOnly;
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.baseRegistry.clear();
    this.transformedFiles.clear();
    this.sourceFileMap.clear();
    this.outputFileMap.clear();
  }

  /**
   * Check if a file path is a transformed component
   */
  isTransformedFile(filePath: string): boolean {
    return this.transformedFiles.has(filePath);
  }

  /**
   * Get the original source path for a transformed file
   */
  getOriginalSourcePath(transformedPath: string): string | undefined {
    return this.sourceFileMap.get(transformedPath);
  }

  /**
   * Get the output path for an original source file
   */
  getOutputPath(sourcePath: string): string | undefined {
    return this.outputFileMap.get(sourcePath);
  }

  /**
   * Rewrite imports for all transformed component files
   */
  rewriteTransformedFileImports(): void {
    const compilerOptions = this.program.getCompilerOptions();

    for (const [outputPath, sourceFile] of this.getAll()) {
      if (!this.isTransformedFile(outputPath)) {
        continue;
      }

      const originalSourcePath = this.getOriginalSourcePath(outputPath);
      if (!originalSourcePath) {
        continue;
      }

      this.updateFileImports(
        sourceFile,
        originalSourcePath,
        outputPath,
        compilerOptions,
      );
    }
  }

  private updateFileImports(
    sourceFile: SourceFile,
    originalSourcePath: string,
    outputPath: string,
    compilerOptions: ts.CompilerOptions,
  ): void {
    if (!this.canUpdateImports(sourceFile)) {
      return;
    }

    // Use proper typing for updateImports
    const updateableSourceFile = sourceFile as SourceFile & {
      updateImports: (
        fn: (importDecl: ts.ImportDeclaration) => ts.ImportDeclaration,
      ) => void;
    };

    updateableSourceFile.updateImports((importDecl: ts.ImportDeclaration) => {
      try {
        const moduleSpecifier = this.extractModuleSpecifier(importDecl);
        if (!moduleSpecifier) {
          return importDecl;
        }

        const resolvedImportPath = this.resolveImportPath(
          moduleSpecifier,
          originalSourcePath,
          compilerOptions,
        );

        if (!resolvedImportPath) {
          // If we can't resolve it, leave it as-is
          return importDecl;
        }

        // Check if the resolved import is one of our transformed files
        const transformedOutputPath = this.getOutputPath(resolvedImportPath);
        const targetPath = transformedOutputPath || resolvedImportPath;

        // Calculate new relative import from the output file to the target
        const newImportPath = this.calculateRelativeImport(
          outputPath,
          targetPath,
        );

        if (newImportPath !== moduleSpecifier) {
          return this.createUpdatedImportDeclaration(importDecl, newImportPath);
        }

        return importDecl;
      } catch (error) {
        console.warn(`Error updating import in ${outputPath}:`, error);
        return importDecl;
      }
    });
  }

  /**
   * Resolve an import specifier to an absolute file path
   */
  private resolveImportPath(
    moduleSpecifier: string,
    containingFile: string,
    compilerOptions: ts.CompilerOptions,
  ): string | null {
    // Handle relative imports
    if (this.isRelativeImportPath(moduleSpecifier)) {
      return this.resolveRelativeImport(moduleSpecifier, containingFile);
    }

    // Handle path mappings (e.g., "@/utils/logging")
    if (compilerOptions.paths) {
      const pathMappedResult = this.resolvePathMapping(
        moduleSpecifier,
        compilerOptions,
      );
      if (pathMappedResult) {
        return pathMappedResult;
      }
    }

    // Handle baseUrl imports (e.g., "utils/logging")
    if (compilerOptions.baseUrl) {
      return this.resolveBaseUrlImport(moduleSpecifier, compilerOptions);
    }

    // If we can't resolve it, it's probably a node_modules import
    return null;
  }

  private resolveRelativeImport(
    moduleSpecifier: string,
    containingFile: string,
  ): string {
    const containingDir = dirname(containingFile);
    const resolved = resolve(containingDir, moduleSpecifier);

    // Try common TypeScript extensions
    const extensions = [".ts", ".tsx", ".ts", ".jsx"];
    for (const ext of extensions) {
      const withExt = `${resolved}${ext}`;
      if (this.program.getSourceFile(withExt)) {
        return withExt;
      }
    }

    // Try as directory with index file
    for (const ext of extensions) {
      const indexPath = resolve(resolved, `index${ext}`);
      if (this.program.getSourceFile(indexPath)) {
        return indexPath;
      }
    }

    return resolved;
  }

  private resolvePathMapping(
    moduleSpecifier: string,
    compilerOptions: ts.CompilerOptions,
  ): string | null {
    if (!compilerOptions.paths) {
      return null;
    }

    const baseUrl = compilerOptions.baseUrl || this.ctx.cwd;

    for (const [pattern, substitutions] of Object.entries(
      compilerOptions.paths,
    )) {
      if (this.matchesPattern(moduleSpecifier, pattern)) {
        for (const substitution of substitutions) {
          const resolved = this.applyPatternSubstitution(
            moduleSpecifier,
            pattern,
            substitution,
            baseUrl,
          );

          if (resolved && this.fileExists(resolved)) {
            return resolved;
          }
        }
      }
    }

    return null;
  }

  private resolveBaseUrlImport(
    moduleSpecifier: string,
    compilerOptions: ts.CompilerOptions,
  ): string | null {
    if (!compilerOptions.baseUrl) {
      return null;
    }

    const baseUrl = resolve(this.ctx.cwd, compilerOptions.baseUrl);
    const resolved = resolve(baseUrl, moduleSpecifier);

    if (this.fileExists(resolved)) {
      return resolved;
    }

    return null;
  }

  private matchesPattern(moduleSpecifier: string, pattern: string): boolean {
    if (!pattern.includes("*")) {
      return moduleSpecifier === pattern;
    }

    const regexPattern = pattern.replace(/\*/g, "(.*)");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(moduleSpecifier);
  }

  private applyPatternSubstitution(
    moduleSpecifier: string,
    pattern: string,
    substitution: string,
    baseUrl: string,
  ): string | null {
    if (!pattern.includes("*")) {
      return resolve(baseUrl, substitution);
    }

    const regexPattern = pattern.replace(/\*/g, "(.*)");
    const regex = new RegExp(`^${regexPattern}$`);
    const match = moduleSpecifier.match(regex);

    if (!match) {
      return null;
    }

    let result = substitution;
    for (let i = 1; i < match.length; i++) {
      result = result.replace("*", match[i]);
    }

    return resolve(baseUrl, result);
  }

  private fileExists(filePath: string): boolean {
    // Try common TypeScript extensions
    const extensions = ["", ".ts", ".tsx", ".ts", ".jsx"];

    for (const ext of extensions) {
      const testPath = `${filePath}${ext}`;
      if (this.program.getSourceFile(testPath)) {
        return true;
      }
    }

    // Try as directory with index file
    for (const ext of [".ts", ".tsx", ".ts", ".jsx"]) {
      const indexPath = resolve(filePath, `index${ext}`);
      if (this.program.getSourceFile(indexPath)) {
        return true;
      }
    }

    return false;
  }

  private calculateRelativeImport(fromPath: string, toPath: string): string {
    const fromDir = dirname(fromPath);
    let relativePath = relative(fromDir, toPath);

    // Remove file extension for imports
    relativePath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "");

    // Normalize path separators for cross-platform compatibility
    relativePath = relativePath.replace(/\\/g, "/");

    // Ensure proper relative path format
    if (!relativePath.startsWith(".")) {
      relativePath = `./${relativePath}`;
    }

    return relativePath;
  }

  private canUpdateImports(sourceFile: SourceFile): boolean {
    return (
      typeof (sourceFile as SourceFile & { updateImports?: unknown })
        .updateImports === "function"
    );
  }

  private isRelativeImportPath(importPath: string): boolean {
    if (!importPath || typeof importPath !== "string") {
      return false;
    }
    return importPath.startsWith("./") || importPath.startsWith("../");
  }

  private extractModuleSpecifier(
    importDecl: ts.ImportDeclaration,
  ): string | null {
    try {
      if (ts.isStringLiteral(importDecl.moduleSpecifier)) {
        return importDecl.moduleSpecifier.text;
      }
      return null;
    } catch {
      return null;
    }
  }

  private createUpdatedImportDeclaration(
    originalDecl: ts.ImportDeclaration,
    newModuleSpecifier: string,
  ): ts.ImportDeclaration {
    try {
      const newModuleSpecifierNode =
        ts.factory.createStringLiteral(newModuleSpecifier);

      return ts.factory.updateImportDeclaration(
        originalDecl,
        originalDecl.modifiers,
        originalDecl.importClause,
        newModuleSpecifierNode,
        originalDecl.attributes,
      );
    } catch (error) {
      console.error("Error creating updated import declaration:", error);
      return originalDecl;
    }
  }
}
