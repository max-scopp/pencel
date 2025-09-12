
# ✏️ Pencil

> Draw your components with familiar syntax — no magic, no lock-in, just clean, shippable code.  
> *Write once. Ship clean.*

## Why Pencil?

**Pencil** is a lightweight toolkit for authoring Web Components using familiar, decorator-based TypeScript syntax — very much inspired by the ergonomics of [Stencil](https://stenciljs.com).

But unlike Stencil, Pencil takes a different approach under the hood:

- 🛠 No compiler lock-in
- 🧩 No enforced bundler or dev server
- 🚫 No automatic polyfills
- 🎯 Build-agnostic, framework-friendly
- 📦 Output: just standard TypeScript Web Components — nothing hidden

It’s ideal for teams building **design systems** that need to be:

- Framework-agnostic (React, Angular, Vue, etc.)
- Easy to consume and integrate
- Fully transparent in how code is authored, shipped, and maintained

---

## ✨ What Makes Pencil Different?

While **Pencil shares a lot of syntax and structure with Stencil**, it follows a different philosophy:

|                     | **Stencil**                                      | **Pencil**                                  |
|---------------------|--------------------------------------------------|---------------------------------------------|
| Syntax              | TypeScript + decorators                          | Same                                          |
| Output              | Compiled JS bundles                              | Pure TS source (no compiler)                 |
| Build system        | Custom compiler + Rollup                         | Bring your own (Vite, Rollup, esbuild, etc.) |
| Polyfills           | Included automatically                           | Opt-in only                                   |
| Framework bindings  | Auto-generated                                  | Source-level generation             |
| Styling             | Scoped CSS, Shadow DOM                           | Same (configurable)                          |
| Runtime             | Lightweight custom runtime (~4–7KB)             | None or minimal (~0–2KB)                     |

> Pencil isn't meant to replace Stencil — it’s just a different spin.  
> In fact, many Stencil components may run unmodified in Pencil.

---

## ✍️ Example: Writing a Component in Pencil

```tsx
import { component, prop, event, h } from '@pencil/core';

@Component('ui-button')
export class UIButton extends HTMLElement {
  @Prop() label: string = 'Click me';
  @Event() clicked: CustomEvent<void>;

  connectedCallback() {
    console.log("We're connected!");
  }

  private onClick = () => {
    this.clicked = new CustomEvent('clicked', { bubbles: true, composed: true });
    this.dispatchEvent(this.clicked);
  };

  private render() {
    return (
      <button part="button" onClick={this.onClick}>
        {this.label}
      </button>
    );
  }
}
```

---

## 🎯 Ideal Use Cases

* Framework-agnostic **design systems**
* Teams that want full control over build output
* Developers who love Stencil’s DX but don’t want compiler magic
* Consumers who need **clear, portable source code**

---

## 🔄 Compatibility with Stencil

Pencil aims to be **syntactically compatible** with Stencil for most use cases.

* Many existing Stencil components can be used as-is or with minor changes
* You can gradually migrate individual components
* Or even share a codebase between both tools if you keep your syntax generic

We’re not trying to be “better” than Stencil — just different.
If Stencil fits your needs, it’s a great tool.
If you want more transparency and less abstraction, Pencil might be a better fit for you.

---

## 📦 Outputs

From a Pencil component, you can optionally generate:

* ✅ Plain TS Web Component code
* ✅ Typed React bindings (`@pencil/react`)
* ✅ Angular wrappers (`@pencil/angular`)
* ✅ Metadata for IDEs and documentation tools

Nothing is mandatory. You own the output.

---

## 🧠 Philosophy

* **Source-first**: your output is plain, readable code — no magic
* **Framework-optional**: bindings are additive, not required
* **No polyfills**: we don’t assume what your consumers need
* **Open and minimal**: you see what you ship

---

## 🚧 Status

Pencil is currently in **active development**.
We’re working on:

* [ ] First stable release of `@pencil/core`
* [ ] React and Angular binding generators
* [ ] CLI for generating components, bindings, and docs
* [ ] Playground and testing tools
* [ ] Compatibility guides for Stencil users

---

## 💬 Contributing

We welcome feedback, ideas, and contributions — especially from:

* Design system teams
* Component library maintainers
* Open-minded Web Component fans

---

## 📜 License

MIT © Pencil Authors

---

## 🙏 Acknowledgements

Pencil wouldn't exist without the inspiration and innovation behind [Stencil](https://stenciljs.com). We deeply respect the project and its community.

This is just a different path — for those who want to draw their components with a different tool.
