import { Component, type ComponentInterface, Host } from "@pencel/runtime";

@Component({
  tag: "button",
})
export class HTMLPenButtonElement extends HTMLButtonElement implements ComponentInterface {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
