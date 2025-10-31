# Pencel Development Guide

Pencel is a **component transpiler engine** that transforms TypeScript decorators (@Component, @Prop, etc.) into multiple framework outputs (React, Angular, Vue) and vanilla Web Components. Not a traditional compiler like Stencil, nor a runtime-only API like Lit—it's a code generation tool that outputs pure, framework-agnostic components.

The architecture consists of three main packages: `@pencel/core` (transpiler), `@pencel/runtime` (decorators & JSX), and `@pencel/cli`.

## Design Philosophy

Pencel is a **component translation engine**: write once in `.pen.tsx`, output to multiple frameworks (React, Angular, Vue, vanilla) from a single source. The architecture separates concerns into three layers:

1. **Semantic Layer (IR)** - Immutable object graph capturing user intent, format-agnostic
2. **Synchronization Layer** - Keeps TypeScript AST nodes in sync with IR state via transformers
3. **Translation Layer** - Generates framework-specific outputs (generators for global files, derivatives for per-source wrappers)

## Architecture Overview

### Compiler Pipeline (packages/core)
The compiler uses an **IR (Intermediate Representation) architecture** with class-based services and dependency injection:

1. **Verify & Discover** → Validate `tsconfig.json`, glob for `*.pen.ts` files
2. **Load** → Create TypeScript `SourceFile` AST objects
3. **Build IR** → Extract component metadata into immutable IR (FileIR → ComponentIR → PropIR/EventIR/MethodIR)
4. **Sync AST** → Update AST nodes to match IR state using transformers, resolve cross-file dependencies
5. **Generate** → Create global files (`ir.json`, `components.d.ts`) from full IR tree
6. **Derive** → Create framework adapters (1:1 per source file)
7. **Write** → Flush all files to disk

Key principles:
- **Input files (`*.pen.ts`) are immutable** - transformers produce new `*.gen.ts` files
- **IR is the single source of truth** - AST is synchronized from IR, not the reverse
- **Generators rebuild fully**, derivatives are incremental (only regenerate on source change)

### Dependency Injection Pattern
Use `inject()` for singleton services—**no decorators, no constructors with parameters**:

```typescript
import { inject } from "../core/container.ts";
import { Config } from "../config.ts";

export class MyService {
  readonly #config = inject(Config);  // ✅ Private field with inject()
  readonly #plugins = inject(Plugins);
  
  // ❌ NEVER: constructor(config: Config) { ... }
}
```

### IR System (IRRI - IR Registry Interface)

Every IR node extends `IRM(kind)` and **auto-registers with IRRI**. Use `IRRef<TIR, TNode>` to pair IR with its AST node:

```typescript
export class ComponentIR extends IRM("Component") {
  readonly #config = inject(Config);
  readonly tag: string;
  readonly props: Array<IRRef<PropertyIR, ts.PropertyDeclaration>>;
}

// Creating an IRRef auto-registers it
const componentIR = new ComponentIR(classDeclaration);
const irRef = new IRRef(componentIR, classDeclaration);  // → calls IRRI.register()
```

**Why IRRef?** Each `IRRef<T, TNode>` holds both:
- **IR** - Immutable semantic model (read-only source of truth)
- **AST node** - Where transformations happen (mutable)

This pairing enables **batch transformations by kind**:

```typescript
// Query all components from IRRI
const components = irri.allByKind('Component');
for (const ref of components) {
  componentTransformer.transform(ref);  // Has both IR and AST node
}
```

**Transformers** use `Transformer(IRType)` base class and override `transform(irr: IRRef<...>)` to update AST nodes based on IR state.

## Testing & Build

- **Test runner**: Bun (`bun test`)
- **Monorepo**: Nx workspace with Bun package manager
- **Build**: `nx run <package>:build` or `bun run build`
- **Linting**: Biome (not ESLint/Prettier)
- **TypeScript**: `nodenext` module resolution, `.ts` extensions in imports required

## Plugin System

Plugins extend the compiler via hooks. Two categories:

### Generators (Global Files)
Always fully rebuild from complete IR tree. No 1:1 mapping to source files.

```typescript
class IRGenerator extends PencelPlugin {
  constructor(userOptions: IRGeneratorOptions) {
    super();
    this.handle("generate", async (hook) => {
      // hook.irs: Array<ImplodeIRRefs<FileIR>>
      // Access ALL file IRs at once for cross-file generation
      await writeFile("ir.json", JSON.stringify(hook.irs, null, 2));
    });
  }
}

Plugins.register("ir", IRGenerator, { path: "ir.json" });
```

Examples: `ir.json`, `components.d.ts`, schema files

### Derivatives (Per-Source Framework Adapters)
Map 1:1 to source files. Only regenerate when source changes (incremental).

```typescript
class AngularOutput extends PencelPlugin {
  constructor(userOptions: AngularOutputOptions) {
    super();
    this.handle("derive", async (hook) => {
      // hook.irr: IRRef<FileIR, SourceFile>
      // Paired with specific FileIR being processed
      generateAngularWrapper(hook.irr.ir, userOptions.outputPath);
    });
  }
}

Plugins.register("angular", AngularOutput, { outputPath: "out/angular" });
```

## Common Patterns

### Adding New Decorators
1. Define runtime decorator in `packages/runtime/src/decorators/`
2. Add IR class in `packages/core/src/compiler/ir/` extending `IRM(kind)`
3. Update `KnownIRs` type in `ir/irri.ts`
4. Create transformer in `packages/core/src/compiler/transformers/` extending `Transformer(IRType)`
5. Register transformer in `FileProcessor` by adding to transformers array

### Extending Component Metadata
Modify `ComponentIR` constructor to parse new decorator options. The IR is built **during first AST visit**, then transformers update the AST based on IR data.

### Querying the IR Registry
```typescript
// Get all components
const components = irri.allByKind('Component');

// Find specific component
const myButton = irri.firstIrr('Component', (comp) => comp.tag === 'my-button');

// Get pure IR without AST references (for generators)
const pureIR = irri.implode(components);
```

### File Processing Workflow
```typescript
// Compiler.compile() orchestrates:
1. program.discover() - Find *.pen.ts files
2. sourceFiles.loadSource() - Create SourceFile ASTs
3. sourceFiles.clearGenerated() - Remove stale outputs
4. fileProcessor.process() - Build FileIR and register with IRRI
5. transformers.transform() - Sync AST nodes from IR state
6. plugins.handle("generate") - Create global files
7. plugins.handle("derive") - Create per-source adapters
8. fileWriter.writeEverything() - Flush to disk
```

## Key Files to Reference

- `packages/core/src/compiler/README.md` - Compiler architecture
- `packages/runtime/SPEC.md` - JSX runtime specification
- `packages/runtime/src/decorators/README.md` - Decorator gotchas
- `packages/core/src/compiler/core/container.ts` - DI implementation
- `packages/core/src/compiler/transformers/component.ts` - Example transformer
- `apps/docs/src/content/docs/internals/` - Architecture documentation

## TypeScript Patterns

- Use `factory.update*()` for AST modifications (preserve identity when possible)
- `ts-utils/` helpers: `singleDecorator()`, `decoratorArgs()`, `recordToObjectLiteral()`
- Always use `.ts` extensions in imports: `import { X } from "./file.ts"`
- Prefer `readonly` fields with private `#field` syntax

## Integration Points

- **Bundlers**: Vite plugin integrates with build systems
- **Frameworks**: React/Angular bindings via `derive` hook
- **Styles**: CSS/SCSS plugins transform `styles`/`styleUrls` → inline strings
- **Type Generation**: `typings` plugin emits `components.d.ts` for JSX IntrinsicElements
