import {
  Component,
  type ComponentInterface,
  Host,
  Prop,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "pen-stack",
})
export class PenStackElement extends HTMLElement implements ComponentInterface {
  @Prop() direction: "row" | "column" = "row";
  @Prop() gap: "xs" | "sm" | "md" | "lg" | "xl" = "md";
  @Prop() align: "start" | "center" | "end" | "stretch" = "stretch";
  @Prop() justify: "start" | "center" | "end" | "between" | "around" = "start";
  @Prop() wrap: boolean = false;

  render() {
    const directionClass = `stack-direction-${this.direction}`;
    const gapClass = `stack-gap-${this.gap}`;
    const alignClass = `stack-align-${this.align}`;
    const justifyClass = `stack-justify-${this.justify}`;
    const wrapClass = this.wrap ? "stack-wrap" : "";

    return (
      <Host
        class={`pen-stack ${directionClass} ${gapClass} ${alignClass} ${justifyClass} ${wrapClass}`}
      >
        <slot />
      </Host>
    );
  }
}
