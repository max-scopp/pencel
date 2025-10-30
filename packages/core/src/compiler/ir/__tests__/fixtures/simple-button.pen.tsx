import {
  Component,
  type ComponentInterface,
  Host,
  Prop,
} from "@pencel/runtime";

@Component({
  tag: "simple-button",
})
export class HTMLSimpleButtonElement
  extends HTMLButtonElement
  implements ComponentInterface
{
  @Prop() label: string = "Click me";

  render() {
    return (
      <Host>
        <button disabled={this.disabled}>{this.label}</button>
      </Host>
    );
  }
}
