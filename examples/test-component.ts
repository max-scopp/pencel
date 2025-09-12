import { Component } from "../packages/runtime/src/index";

@Component({
  tagName: "fancy-button",
})
class FancyButton extends HTMLButtonElement {
  constructor() {
    super();
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
