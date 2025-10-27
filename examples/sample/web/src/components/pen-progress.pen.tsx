import {
  Component,
  type ComponentInterface,
  Host,
  Prop,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "pen-progress",
})
export class PenProgressElement
  extends HTMLElement
  implements ComponentInterface
{
  @Prop() value: number = 0;
  @Prop() max: number = 100;
  @Prop() variant: "default" | "striped" | "animated" = "default";
  @Prop() color: "primary" | "success" | "warning" | "error" = "primary";
  @Prop() size: "sm" | "md" | "lg" = "md";
  @Prop() showLabel: boolean = false;

  render(): VNode {
    const percentage = Math.min((this.value / this.max) * 100, 100);
    const variantClass = `progress-variant-${this.variant}`;
    const colorClass = `progress-color-${this.color}`;
    const sizeClass = `progress-size-${this.size}`;

    return (
      <Host class={`pen-progress ${variantClass} ${colorClass} ${sizeClass}`}>
        <div class="progress-bar-container">
          <div
            class="progress-bar"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={this.value}
            aria-valuemin={0}
            aria-valuemax={this.max}
          />
        </div>
        {this.showLabel && (
          <span class="progress-label">{Math.round(percentage)}%</span>
        )}
      </Host>
    );
  }
}
