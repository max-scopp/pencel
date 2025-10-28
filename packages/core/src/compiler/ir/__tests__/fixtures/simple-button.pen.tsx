import {
  Component,
  type ComponentInterface,
  Host,
  Prop,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "simple-button",
})
export class HTMLSimpleButtonElement
  extends HTMLButtonElement
  implements ComponentInterface
{
  @Prop() label: string = "Click me";
  @Prop() disabled: boolean = false;

  render(): VNode {
    return (
      <Host>
        <button disabled={this.disabled}>{this.label}</button>
      </Host>
    );
  }
}
