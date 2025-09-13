// biome-ignore lint/correctness/noUnusedImports: <explanation>

import {
  Component,
  type ComponentInterface,
  Fragment,
  Host,
  h,
  type JSXElement,
  Prop,
  render,
  State,
} from "../../src";

@Component({
  tag: "fancy-button",
  styles: `
    button[is="pen-fancy-button"] {
      background: #007bff;
      border: none;
      border-radius: 4px;
      color: white;
      padding: 8px 16px;
      cursor: pointer;
    }
  `,
})
class FancyButton extends HTMLButtonElement implements ComponentInterface {
  @Prop({
    reflect: true,
    type: Boolean,
  })
  isVisible = true;

  constructor() {
    super();
  }

  connectedCallback() {
    console.log("Custom button connected!", this.isVisible);
    // Apply the emotion CSS class
  }

  render(): JSXElement {
    return (
      <Host onClick={() => console.log("Host clicked!")}>
        <slot />
        Default Button
      </Host>
    );
  }
}

// Example using explicit extends option (doesn't need to inherit)
@Component({
  tag: "custom-input",
})
class CustomInput extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log("Custom input connected!");
  }
}

// Example without explicit tagName (uses class name)
@Component({
  tag: "simple",
  shadow: true,
})
class SimpleElement extends HTMLElement implements ComponentInterface {
  @Prop({ reflect: true })
  name: string;

  constructor() {
    super();
  }

  render(): JSXElement {
    return (
      <Host class="simple-element">
        <slot></slot>
        it works! {this.name}
      </Host>
    );
  }
}

// Example usage
const app = (
  <div class="container">
    <h1>Pencil Components with Emotion CSS</h1>
    <button type="button" is="pen-fancy-button">
      Styled Button
    </button>
    <pen-simple>Simple Element</pen-simple>
  </div>
);

// setTimeout(() => {
// Render to DOM
const root = document.getElementById("root");
if (root) {
  render(app, root);
}
// }, 1000);
