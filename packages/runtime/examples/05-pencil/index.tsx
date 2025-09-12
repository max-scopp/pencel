// biome-ignore lint/correctness/noUnusedImports: <explanation>
import { Component, h, render } from "../../src";

@Component({
  tagName: "fancy-button",
})
class FancyButton extends HTMLButtonElement {
  constructor() {
    super();

    debugger;
  }

  connectedCallback() {
    console.log("Custom button connected!");
  }
}

// Example without explicit tagName (uses class name)
@Component({
  tagName: "simple",
})
class SimpleElement extends HTMLElement {
  constructor() {
    super();
  }
}

// Example usage
const app = (
  <div class="container">
    <h1>Pencil Components Example</h1>
    <pen-fancy-button>Fancy Button</pen-fancy-button>
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
