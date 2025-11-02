import { Component, type ComponentInterface, Event, Host, Prop, State } from "@pencel/runtime";

@Component({
  tag: "pen-toast",
})
export class PenToastElement extends HTMLElement implements ComponentInterface {
  @Prop() type: "success" | "error" | "warning" | "info" = "info";
  @Prop() duration?: number;
  @Prop() closeable: boolean = true;
  @Prop() position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" =
    "top-right";

  @State() visible: boolean = true;

  @Event() close: CustomEvent<void>;

  #timeoutId: ReturnType<typeof setTimeout> | null = null;

  componentDidLoad() {
    if (this.duration && this.duration > 0) {
      this.#timeoutId = setTimeout(() => {
        this.dismiss();
      }, this.duration);
    }
  }

  componentWillUnmount() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
    }
  }

  dismiss = () => {
    this.visible = false;
    this.close.emit();
  };

  render() {
    if (!this.visible) {
      return null;
    }

    const typeClass = `toast-type-${this.type}`;
    const positionClass = `toast-position-${this.position}`;

    const iconMap = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    return (
      <Host class={`pen-toast ${typeClass} ${positionClass}`}>
        <div class="toast-container">
          <span class="toast-icon">{iconMap[this.type]}</span>
          <div class="toast-content">
            <slot />
          </div>
          {this.closeable && (
            <button class="toast-close" onClick={this.dismiss} aria-label="Close notification">
              ✕
            </button>
          )}
        </div>
      </Host>
    );
  }
}
