# Examples

This folder contains example files demonstrating the Pencil compiler functionality.

## Files

### test-component.ts

A comprehensive example showing different ways to use the `@Component()` decorator:

- **With explicit tagName**: `@Component({ tagName: "my-custom-button" })` - Uses the specified tag name
- **Without tagName**: `@Component()` - Uses the class name converted to lowercase
- **Inheritance**: Shows both `HTMLButtonElement` (customized built-in) and `HTMLElement` (autonomous) components

### pencil.config.example.ts

An example configuration file showing:

- **Type-safe configuration** using `defineConfig()`
- **Compiler options** for TypeScript target and decorators
- **Output settings** for build directory and format
- **Tag namespace** feature that prefixes all component tag names

## Component Decorator Options

The `@Component()` decorator now supports options:

```typescript
interface ComponentOptions {
  tagName?: string;  // Explicit tag name for the component
}

// Usage examples:
@Component({ tagName: "my-button" })  // Uses "my-button"
@Component()                         // Uses class name in lowercase
```

## Tag Namespace Configuration

The `tagNamespace` config option prefixes all component tag names:

```typescript
// pencil.config.ts
export default defineConfig({
  tagNamespace: 'my-app-',  // All components get this prefix
  // ... other options
});

// Results in:
@Component() class MyButton {}     // → "my-app-mybutton"
@Component({ tagName: "special" }) // → "my-app-special"
```

## Usage

### Transforming Components

```bash
# Transform with default config
./packages/cli/out/cli transform --file examples/test-component.ts

# Transform with custom config
./packages/cli/out/cli transform --file examples/test-component.ts --config examples/pencil.config.example.ts

# Save output to file
./packages/cli/out/cli transform --file examples/test-component.ts --output examples/transformed.ts
```

The transformed output includes the appropriate `customElements.define()` calls for registering your web components with the browser.
