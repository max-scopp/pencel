// biome-ignore lint/correctness/noUnusedImports: <explanation>

import {
  Component,
  type ComponentInterface,
  Fragment,
  h,
  type JSXElement,
  render,
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
  constructor() {
    super();
  }

  connectedCallback() {
    console.log("Custom button connected!");
    // Apply the emotion CSS class
  }

  render(): JSXElement {
    return <></>;
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
class SimpleElement extends HTMLElement {
  constructor() {
    super();
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
