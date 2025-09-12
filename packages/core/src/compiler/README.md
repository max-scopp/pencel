## 🗂️ Suggested Folder Structure

```
compiler/
│
├── api/                      # Public-facing API for the compiler
│   └── index.ts
│
├── core/                     # Core orchestrators (entry points, pipelines)
│   ├── compiler.ts
│   └── build.ts
│
├── config/                   # Compiler config parsing and normalization
│   └── config-loader.ts
│
├── transforms/              # AST transforms (TypeScript AST + internal)
│   ├── component-transform.ts
│   ├── module-transform.ts
│   └── style-transform.ts
│
├── analysis/                # Static analysis & metadata extraction
│   ├── component-analyzer.ts
│   ├── dependency-graph.ts
│   └── type-checker.ts
│
├── resolution/              # Module & file resolution logic
│   ├── module-resolver.ts
│   ├── path-alias.ts
│   └── virtual-modules.ts
│
├── codegen/                 # Code generation (JS, CSS, hydrated builds)
│   ├── component-codegen.ts
│   ├── style-emitter.ts
│   └── manifest-writer.ts
│
├── ir/                      # Intermediate representation (optional)
│   ├── ir-builder.ts
│   └── ir-types.ts
│
├── output/                  # Emission of files/artifacts
│   ├── file-writer.ts
│   ├── output-targets.ts
│   └── diagnostics-emitter.ts
│
├── utils/                   # Shared internal utilities
│   ├── fs-utils.ts
│   ├── ast-utils.ts
│   └── log.ts
│
└── types/                   # Internal types and interfaces
    ├── compiler-types.ts
    └── config-types.ts
```

---

## 🔍 Key Terminology Mapping

| Compiler Term     | Purpose in Stencil's Context                                  |
| ----------------- | ------------------------------------------------------------- |
| **Transform**     | AST or metadata-level changes before generation               |
| **Analysis**      | Static analysis (e.g., decorators, props, methods, lifecycle) |
| **Resolution**    | Module, file, path, and import resolution                     |
| **CodeGen**       | Emits final JS/CSS/hydration modules                          |
| **IR (optional)** | Acts as an intermediate format between analysis and codegen   |
| **Output**        | Writes files, handles output targets, diagnostics             |
