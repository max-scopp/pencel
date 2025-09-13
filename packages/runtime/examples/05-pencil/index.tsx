// biome-ignore lint/correctness/noUnusedImports: <explanation>

import { css } from "@emotion/css";
import {
  Component,
  type ComponentInterface,
  Fragment,
  h,
  type JSXElement,
  render,
} from "../../src";

const fancyButtonStyles = css`
  background: #007bff;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 8px 16px;
  cursor: pointer;
  
  &:hover {
    background: #0056b3;
  }
`;

@Component({
  tagName: "fancy-button",
})
class FancyButton extends HTMLButtonElement implements ComponentInterface {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log("Custom button connected!");
    // Apply the emotion CSS class
    this.className = fancyButtonStyles;
  }

  render(): JSXElement {
    return <></>;
  }
}

// Example using explicit extends option (doesn't need to inherit)
@Component({
  tagName: "custom-input",
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
