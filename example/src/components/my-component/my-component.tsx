import { Component } from "@pencel/runtime";

@Component({
  tag: "fancy-button",
  styleUrl: "./my-component.css",
})
class FancyButton extends HTMLButtonElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log("Custom button connected!");
  }
}

@Component()
class SimpleElement extends HTMLElement {
  constructor() {
    super();
  }
}
