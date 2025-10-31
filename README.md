# ✏️ Pencel

Write components once. Output to React, Angular, Vue, and vanilla JS.

## Quick Example

```tsx
import { Component, Prop, Event } from '@pencel/runtime';

@Component({ tag: 'my-button' })
export class MyButton extends HTMLButtonElement {
  @Prop() label = 'Click me';
  @Event() declare clicked: CustomEvent<void>;

  render() {
    return (
      <Host onClick={() => this.clicked.emit()}>
        {this.label}
      </Host>
    );
  }
}
```

## Features

- **Framework Agnostic** – One source, multiple outputs
- **Full Native Control** – Extend HTML elements directly
- **Lean Runtime** – ~4 kB gzipped
- **TypeScript First** – Decorators, JSX, type-safe
- **Pure Web Components** – Transpiler output, not vendor lock-in

## Documentation

[Read the docs](https://critical-graphite.github.io/pencel/) for setup, best practices, and internals.

## License

MIT © Max Scopp