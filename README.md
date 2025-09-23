
# ✏️ Pencel

> Draw your components with familiar syntax — no magic, no lock-in, just clean, shippable code.  
> *Write once. Ship clean.*

## ⚡ Current Status

Pencel is under active development. Current feature status:

✅ Core Features:
* Component registration with `@Component`
* Reactive properties with `@Prop`
* Internal state management with `@State`
* Basic lifecycle hooks
* Shadow DOM and styling support

🚧 In Progress:
* Method decorators and exposure
* Event system improvements
* Watch decorator for property changes
* Additional lifecycle hooks
* Performance optimizationsan, shippable code.  

## Why Pencel?

**Pencel** is a lightweight toolkit for authoring Web Components using familiar, decorator-based TypeScript syntax — very much inspired by the ergonomics of [Stencil](https://stenciljs.com).

But unlike Stencil, Pencel takes a different approach under the hood:

- 🛠 No compiler lock-in
- 🧩 No enforced bundler or dev server
- 🚫 No automatic polyfills (handled by your bundler if needed)
- 🎯 Build-agnostic, framework-friendly
- 📦 Output: just standard TypeScript Web Components — nothing hidden

It’s ideal for teams building **design systems** that need to be:

- Framework-agnostic (React, Angular, Vue, etc.)
- Easy to consume and integrate
- Fully transparent in how code is authored, shipped, and maintained

---

## ✨ What Makes Pencel Different?

While **Pencel shares a lot of syntax and structure with Stencil**, it follows a different philosophy:

|                     | **Stencil**                                      | **Pencel**                                  |
|---------------------|--------------------------------------------------|---------------------------------------------|
| Syntax              | TypeScript + decorators                          | Same                                          |
| Output              | Compiled JS bundles                              | Pure TS source (no compiler)                 |
| Build system        | Custom compiler + Rollup                         | Bring your own (Vite, Rollup, esbuild, etc.) |
| Polyfills           | Included automatically                           | Not included; handled by your bundler         |
| Framework bindings  | Auto-generated                                  | Source-level generation             |
| Styling             | Scoped CSS, Shadow DOM                           | Same (configurable)                          |
| Runtime             | Lightweight custom runtime (**up to ~4–7KB**, if all features are used) | Minimal runtime (~2-3KB for core features)    |
> **Note:** The reported runtime size (~4–7KB) is the maximum if all features are included. Most modern bundlers (Vite, Rollup, esbuild, etc.) will tree-shake unused features, so your actual shipped runtime will likely be smaller depending on what you use.

> Pencel isn't meant to replace Stencil — it’s just a different spin.  
> In fact, many Stencil components may run unmodified in Pencel.

---

## ✍️ Example: Writing a Component in Pencel

```tsx
import { Component, Prop, Event } from '@pencel/runtime';

@Component({
  tag: 'ui-button'
})
export class UIButton extends HTMLElement {
  @Prop() label: string = 'Click me';

  @Event()
  declare clicked: CustomEvent<void>;

  connectedCallback() {
    console.log("We're connected!");
  }

  private onClick = () => {
    const event = new CustomEvent('clicked', { 
      bubbles: true, 
      composed: true 
    });
    this.dispatchEvent(event);
  };

  render() {
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

Pencel aims to be **syntactically compatible** with Stencil for most use cases.

* Many existing Stencil components can be used as-is or with minor changes
* You can gradually migrate individual components
* Or even share a codebase between both tools if you keep your syntax generic

We’re not trying to be “better” than Stencil — just different.
If Stencil fits your needs, it’s a great tool.
If you want more transparency and less abstraction, Pencel might be a better fit for you.

---

## 📦 Outputs

From a Pencel component, you can optionally generate:

* ✅ Plain TS Web Component code
* ✅ Typed React bindings (`@pencel/react`)
* ✅ Angular wrappers (`@pencel/angular`)
* ✅ Metadata for IDEs and documentation tools

Nothing is mandatory. You own the output.

---

## 🧠 Philosophy

* **Source-first**: your output is plain, readable code — no magic
* **Framework-optional**: bindings are additive, not required
* **No polyfills**: Pencil does not include or inject any polyfills. If your target environment requires polyfills (e.g., for older browsers), configure your bundler (Vite, Rollup, esbuild, etc.) to include them as needed.
* **Open and minimal**: you see what you ship

---

## 🚧 Status

Pencel is currently in **active development**.
We’re working on:

* [ ] First stable release of `@pencel/core`
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

MIT © Pencel Authors

---

## 🙏 Acknowledgements

Pencel wouldn't exist without the inspiration and innovation behind [Stencil](https://stenciljs.com). We deeply respect the project and its community.

This is just a different path — for those who want to draw their components with a different tool.
