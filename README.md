# ✏️ Pencel

> Draw components with familiar syntax — no magic, no lock-in.  
> *Graphite points, fission sparks*

## ⚡ Quick Example

```tsx
import { Component, Prop, Event } from '@pencel/runtime';

@Component({ tag: 'button' })
export class Button extends HTMLElement {
  @Prop() label = 'Click me';
  @Event() declare clicked: CustomEvent<void>;

  render() {
    return (
      <button part="button" onClick={() => this.clicked.emit()}>
        {this.label}
      </button>
    );
  }
}
```

## Key Features

* 🛠 **No Compiler Lock-in** — works with any bundler
* 🧩 **Framework Agnostic** — React, Angular, or vanilla
* 📦 **Tiny Runtime** — ~3.2 kB gzipped
* 🎯 **Pure Output** — standard TypeScript Web Components
* 🖌 **Full Control** — extend and customize

## Documentation

See [docs](https://maxscopp.de/pencel/) for setup, lifecycle, and integrations.

## Philosophy

* **Source-first**: readable code, no magic
* **Framework-optional**: bindings are additive
* **Minimal runtime**: ship only what you use
* **Transparent**: you see what you ship

## License

MIT © Max Scopp