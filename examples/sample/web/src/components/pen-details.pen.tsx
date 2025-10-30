import {
  Component,
  type ComponentInterface,
  Host,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "details",
})
export class HTMLPenDetailsElement
  extends HTMLDetailsElement
  implements ComponentInterface
{
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
