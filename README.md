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

## Contributing

Pencel is an ambitious project, and contributions and feedback are **highly welcome**! This is a significant undertaking for a single developer, so any help—whether it's bug reports, feature suggestions, documentation improvements, or code contributions—makes a real difference.

**Built with** TypeScript >5, Nx, Biome, Bun and tsdown. See [Understanding Pencel](https://critical-graphite.github.io/pencel/internals/understanding/) for architecture details.

### Getting Started

If you'd like to contribute, here are a few quick tips:

- **Have feedback?** Open an issue or discussion—all ideas are appreciated!
- **Ready to contribute code?** Fork the repo, make your changes, and submit a pull request.
- **Linting issues?** If GitHub checks fail due to formatting, many issues can be automatically fixed with:
  ```bash
  nx run-many -t lint-fix
  ```
  This applies Biome formatting and fixes across all packages. Review and commit the changes after running.

Thank you for helping make Pencel better! 🙏

## License

MIT © Max Scopp