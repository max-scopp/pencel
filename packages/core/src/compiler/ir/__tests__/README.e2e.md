# E2E Tests for RenderTransformer

This directory contains end-to-end tests that verify the complete JSX to zero-vdom transformation pipeline.

## Overview

The e2e tests:
1. Read `.pen.tsx` component files from `fixtures/`
2. Transform JSX to zero-vdom code using the `RenderTransformer`
3. Execute the transformed code in a happy-dom environment
4. Verify the resulting DOM structure matches expectations
5. Compare against snapshot files

## Test Components

### `todo-item.pen.tsx`
A simple todo item component with:
- Text display
- Checkbox for completion
- Conditional className based on completion status

### `simple-button.pen.tsx`
A button component with:
- Label text
- Disabled state

## How It Works

1. **Transformation**: The test reads a `.pen.tsx` file and uses `RenderIR` + `RenderTransformer` to convert JSX into zero-vdom imperative code with `once()`, `setChildren()`, etc.

2. **Execution**: The transformed code is executed in a happy-dom environment with:
   - Patched `document.createElement` to handle `className` and boolean attributes correctly
   - Custom `setChildren` that converts strings to text nodes
   - Component instance with properties as `this` context

3. **Verification**: The resulting DOM elements are checked for:
   - Correct structure
   - Proper attribute/property values
   - Text content
   - Snapshot consistency

## Key Implementation Details

### setAttribute Patching
The tests patch `setAttribute` on created elements to handle:
- `className` → maps to `.className` property
- `checked` → maps to `.checked` property (boolean)
- `disabled` → maps to `.disabled` property (boolean)

This is necessary because the transformer currently generates `setAttribute` calls for all attributes, but some need to be properties in the DOM.

### IIFE Context Binding
The transformer wraps render logic in an IIFE: `return function() { ... }()`.  
The tests extract the IIFE body and execute it with the component instance as `this` to properly bind properties like `this.text` and `this.completed`.

### Zero-vdom Cache
Tests use the `cacheLexer` symbol pattern to implement the `once()` function for element caching, ensuring elements are created once and reused across renders (fundamental to zero-vdom).

## Running Tests

```bash
bun test src/compiler/ir/__tests__/render.e2e.test.ts
```

## Snapshots

Snapshot files are stored in `__snapshots__/render.e2e.test.ts.snap` and capture:
- DOM structure (HTML output)
- Element properties (checked, disabled, className, etc.)
- Transformation metadata (code contains expected patterns)
