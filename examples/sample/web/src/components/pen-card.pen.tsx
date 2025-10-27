import {
  Component,
  type ComponentInterface,
  Host,
  Prop,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "pen-card",
})
export class PenCardElement extends HTMLElement implements ComponentInterface {
  @Prop() variant: "elevated" | "outlined" | "filled" = "elevated";
  @Prop() padding: "sm" | "md" | "lg" = "md";

  render(): VNode {
    const paddingClass = `card-padding-${this.padding}`;
    const variantClass = `card-variant-${this.variant}`;

    return (
      <Host class={`pen-card ${variantClass}`}>
        <div class={`card-content ${paddingClass}`}>
          <slot />
        </div>
      </Host>
    );
  }
}
