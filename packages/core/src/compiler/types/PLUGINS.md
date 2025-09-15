# Plugin System

The Pencil plugin system provides a simple and flexible way to extend the compiler functionality through plugins. Plugins are just functions that receive user options and context.

## Basic Usage

### Plugin Configuration

You can configure plugins in two ways:

1. **Simple string configuration** (no options):
```typescript
const config: PencelConfig = {
  plugins: ['my-transform-plugin', 'my-optimization-plugin']
};
```

2. **Object configuration** (with custom options):
```typescript
const config: PencelConfig = {
  plugins: [
    'simple-plugin',
    {
      name: 'advanced-plugin',
      options: {
        include: ['**/*.tsx'],
        exclude: ['**/*.test.tsx'],
        customSetting: true
      }
    }
  ]
};
```

## Creating a Plugin

A plugin is simply a function that receives user options and context:

```typescript
import type { PluginFunction, PluginContext } from '@pencil/core';

const myPlugin: PluginFunction<{ enabled: boolean; pattern: string }> = async (options, context) => {
  const { cwd, config } = context;
  
  console.log(`Plugin running in: ${cwd}`);
  console.log(`Plugin options:`, options);
  console.log(`Full config:`, config);
  
  if (options.enabled) {
    // Your plugin logic here
    console.log(`Processing files matching: ${options.pattern}`);
  }
};

// Register the plugin
registerPlugin('my-plugin', { enabled: true, pattern: '**/*.tsx' }, myPlugin);
```

## Extending Plugin Options (Type Safety)

Other npm packages can extend the plugin system for better type safety using TypeScript module augmentation:

```typescript
// In your-plugin-package/types.ts
declare module '@pencil/core/compiler/types/plugins' {
  interface PluginOptions {
    'my-custom-plugin': {
      customOption?: boolean;
      value?: number;
      mode?: 'development' | 'production';
    };
    'another-plugin': {
      pattern?: string;
      enabled?: boolean;
    };
  }
}

// Now you get full type safety
const config: PencelConfig = {
  plugins: [
    {
      name: 'my-custom-plugin',
      options: {
        customOption: true,
        value: 42,
        mode: 'production' // TypeScript will validate this
      }
    }
  ]
};
```

## Plugin Context

The `PluginContext` provides access to:

- **`cwd`**: Current working directory
- **`config`**: The complete Pencil configuration object

## Registration

Use the `registerPlugin` function to register your plugin:

```typescript
registerPlugin<MyOptionsType>(
  'plugin-name',
  userOptions,
  pluginFunction
);
```

## Example: File Processing Plugin

```typescript
import type { PluginFunction } from '@pencil/core';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

interface ProcessorOptions {
  pattern: string;
  transform: (content: string) => string;
}

const fileProcessor: PluginFunction<ProcessorOptions> = async (options, context) => {
  const files = glob.sync(options.pattern, { cwd: context.cwd });
  
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const transformed = options.transform(content);
    writeFileSync(file, transformed);
  }
};

// Usage
registerPlugin('file-processor', {
  pattern: 'src/**/*.ts',
  transform: (content) => content.replace(/console\.log/g, '// console.log')
}, fileProcessor);
```

This simple design makes plugins easy to write, test, and compose!