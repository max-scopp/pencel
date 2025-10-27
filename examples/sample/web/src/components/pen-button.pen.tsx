import {
  Component,
  type ComponentInterface,
  Host,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "button",
})
export class HTMLPenButtonElement
  extends HTMLButtonElement
  implements ComponentInterface
{
  render(): VNode {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
