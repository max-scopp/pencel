## 🗂️ Folder Structure

```
compiler/
│
├── core/                     # Core services and DI container
│   ├── container.ts          # Lightweight DI with inject() pattern
│   ├── compiler.ts           # Main compiler orchestrator
│   ├── program-registry.ts   # TypeScript program management
│   └── source-file-registry.ts
│
├── transformers/             # Component file transformers
│   ├── component-file-transformer.ts      # Main orchestrator
│   ├── component-decorator-transformer.ts
│   ├── props-decorator-transformer.ts
│   └── constants.ts          # Decorator names and constants
│
├── processors/               # File validation and utilities
│   ├── file-processor.ts     # Validation and filtering
│   └── decorator-processor.ts
│
├── factories/                # Object creation utilities
│   └── source-file-factory.ts
│
├── ir/                       # Intermediate representation
│   ├── component-ir.ts       # Component metadata and .d.ts generation
│   └── component-ir-builder.ts
│
├── analysis/                 # Static analysis
│   └── type-analyzer.ts
│
├── resolution/               # Module resolution
│   └── module-resolver.ts
│
├── transforms/               # Style and asset processing
│   └── process-styles.ts
│
├── output/                   # File emission
│   └── write-all-files.ts
│
├── utils/                    # Shared utilities
│   ├── marker.ts
│   ├── sourceFileSha256.ts
│   └── getOutputPathForSource.ts
│
└── types/                    # Type definitions
    ├── compiler-types.ts
    ├── config-types.ts
    └── plugins.ts
```

---

## 🏗️ Core Design Principles

- **Class-based architecture** with lightweight DI container
- **No decorators** - use simple `inject()` pattern for dependencies
- **Specific naming** - avoid generic terms like "Base" or "Manager"
- **Pragmatic over pure** - break clean patterns for velocity when reasonable
- **Single-pass IR building** - construct intermediate representation during transformation
- **Focused transformers** - each transformer handles one decorator type

---

## 🔍 Key Components

| Component                 | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| **Core Services**         | Singleton services for compiler state (DI managed)       |
| **Transformers**          | Convert decorated TypeScript to runtime components       |
| **Component IR**          | Metadata extraction for .d.ts generation and validation  |
| **File Processor**        | Validation and filtering of source files                 |
| **inject() Pattern**     | Dependency injection without decorators or ceremony      |
| **Preprocessors**         | Symbol collection and import injection before printing  |

---

## 🔄 Transform Pipeline

1. **File Validation** - Check if file should be processed
2. **Source File Creation** - Generate transformed TypeScript AST
3. **IR Building** - Extract component metadata during transformation
4. **Decorator Processing** - Transform @Component, @Prop, etc.
5. **Registration** - Register transformed files and IR for output
6. **Preprocessing** - Collect referenced symbols and inject imports (before printing)
7. **Printing** - Convert AST to source code and format
