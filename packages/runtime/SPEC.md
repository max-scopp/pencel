# JSX Runtime Specification

## Overview

A lightweight JSX-compatible runtime focused on efficient rendering and diffing operations. This specification defines a minimal API that maintains compatibility with Stencil's JSX implementation while providing a cleaner, more focused approach.

## Core Types

```typescript
type JSXElement = {
  type: string | Function;
  props: Record<string, any>;
  children: Array<JSXElement | string | number | boolean | null>;
  key?: string | number;
};

type VNode = {
  $type$: string | Function;
  $props$: Record<string, any>;
  $children$: Array<VNode | string | number | boolean | null>;
  $key$: string | number | null;
  $elm$?: HTMLElement | null;
  $text$?: string;
};
```

## Runtime API

### h
```typescript
function h(
  type: string | Function,
  props?: Record<string, any> | null,
  ...children: any[]
): JSXElement;
```

### render
```typescript
function render(
  vnode: JSXElement,
  container: HTMLElement,
  replaceNode?: HTMLElement | null
): void;
```

### patch
```typescript
function patch(
  oldVNode: VNode | null,
  newVNode: VNode
): VNode;
```

## Event Handling

Events follow a simplified delegation model:

```typescript
interface EventDelegation {
  addEventListener(
    eventName: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void;
  
  removeEventListener(
    eventName: string,
    handler: EventListener,
    options?: boolean | EventListenerOptions
  ): void;
}
```

## Attribute Handling

### Standard Attributes
- Direct mapping of HTML attributes
- Automatic case conversion for DOM properties
- Special handling for `class`, `style`, and `ref`

```typescript
interface AttributeHandler {
  set(element: HTMLElement, name: string, value: any): void;
  remove(element: HTMLElement, name: string): void;
}
```

## Component Interface

```typescript
interface Component {
  render(): JSXElement | null;
}
```

## Lifecycle Hooks

Minimal set of lifecycle hooks:

```typescript
interface LifecycleHooks {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  attributeChangedCallback?(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void;
}
```

## Virtual DOM Diffing Rules

1. Different element types trigger full replacement
2. Same element types compare attributes and update differences
3. Children are diffed using key-based reconciliation
4. Text nodes are compared and updated efficiently

## JSX Factory Configuration

```typescript
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

## Fragment Support

```typescript
const Fragment = Symbol('Fragment');
```

## Performance Considerations

1. Flat VNode structure for efficient memory usage
2. Minimal object creation during diffing
3. Event delegation for reduced memory footprint
4. Batched DOM updates
5. Static node caching

## Error Handling

```typescript
interface ErrorBoundary {
  catchError(error: Error): void;
  renderError(error: Error): JSXElement | null;
}
```

## Development Utilities

```typescript
interface DevTools {
  inspect(vnode: VNode): void;
  getVNodeTree(): VNode[];
  enableTracking(): void;
  disableTracking(): void;
}
```