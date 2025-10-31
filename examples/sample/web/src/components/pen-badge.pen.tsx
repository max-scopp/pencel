import {
  Component,
  type ComponentInterface,
  Host,
  Prop,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "pen-badge",
})
export class PenBadgeElement extends HTMLElement implements ComponentInterface {
  @Prop() variant: "primary" | "secondary" | "success" | "warning" | "error" =
    "primary";
  @Prop() size: "sm" | "md" | "lg" = "md";
  @Prop() count?: number;
  @Prop() max?: number;
  @Prop() dot: boolean = false;

  render() {
    const variantClass = `badge-variant-${this.variant}`;
    const sizeClass = `badge-size-${this.size}`;

    const displayCount =
      this.count !== undefined &&
      this.max !== undefined &&
      this.count > this.max
        ? `${this.max}+`
        : this.count;

    return (
      <Host class={`pen-badge ${variantClass} ${sizeClass}`}>
        {this.dot ? (
          <span class="badge-dot" />
        ) : (
          <span class="badge-content">
            {displayCount !== undefined ? (
              <span class="badge-count">{displayCount}</span>
            ) : (
              <slot />
            )}
          </span>
        )}
      </Host>
    );
  }
}
