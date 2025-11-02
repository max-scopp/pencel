/// <reference types="@pencel/runtime" />

export class HostAndSlotComponent {
  variant: "primary" | "secondary" = "primary";

  render() {
    return (
      <div class={`card card-${this.variant}`}>
        <div class="card-header">
          <slot name="header" />
        </div>
        <div class="card-content">
          <slot />
        </div>
        <div class="card-footer">
          <slot name="footer" />
        </div>
      </div>
    );
  }
}
