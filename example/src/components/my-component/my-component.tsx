import { Component, Prop, State } from "@pencel/runtime";

@Component({
  tag: "fancy-button",
  styleUrl: "./my-component.css",
})
class FancyButton extends HTMLButtonElement {
  @Prop({ type: Boolean, reflect: true })
  isDisabled = false;

  @State() isActive: number = 1;

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
