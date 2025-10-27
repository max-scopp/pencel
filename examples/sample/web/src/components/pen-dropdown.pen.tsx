import {
  Component,
  type ComponentInterface,
  Event,
  Host,
  Prop,
  State,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "pen-dropdown",
})
export class PenDropdownElement
  extends HTMLElement
  implements ComponentInterface
{
  @Prop() label: string = "";
  @Prop() placement:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-start"
    | "bottom-start" = "bottom";
  @Prop() trigger: "click" | "hover" = "click";

  @State() isOpen: boolean = false;

  @Event() open: CustomEvent<void>;
  @Event() close: CustomEvent<void>;

  handleTrigger = () => {
    if (this.trigger === "click") {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.open.emit();
      } else {
        this.close.emit();
      }
    }
  };

  handleMouseEnter = () => {
    if (this.trigger === "hover") {
      this.isOpen = true;
      this.open.emit();
    }
  };

  handleMouseLeave = () => {
    if (this.trigger === "hover") {
      this.isOpen = false;
      this.close.emit();
    }
  };

  render(): VNode {
    const placementClass = `dropdown-placement-${this.placement}`;
    const isOpenClass = this.isOpen ? "dropdown-open" : "";

    return (
      <Host
        class={`pen-dropdown ${placementClass} ${isOpenClass}`}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <button
          class="dropdown-trigger"
          onClick={this.handleTrigger}
          aria-haspopup="true"
          aria-expanded={this.isOpen}
        >
          {this.label}
          <span class="dropdown-icon">▼</span>
        </button>
        {this.isOpen && (
          <div class="dropdown-menu" role="menu">
            <slot />
          </div>
        )}
      </Host>
    );
  }
}
