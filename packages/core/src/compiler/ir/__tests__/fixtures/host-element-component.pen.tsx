/// <reference types="@pencel/runtime" />

import { Host } from "@pencel/runtime";

export class HostElementComponent {
  variant: "primary" | "secondary" = "primary";
  padding: "sm" | "md" | "lg" = "md";

  render() {
    const paddingClass = `host-padding-${this.padding}`;
    const variantClass = `host-variant-${this.variant}`;

    return (
      <Host class={`host-wrapper ${variantClass}`}>
        <div class={`host-content ${paddingClass}`}>
          <slot />
        </div>
      </Host>
    );
  }
}
