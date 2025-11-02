/// <reference types="@pencel/runtime" />

import { Host } from "@pencel/runtime";

export class HostWithMultipleSlots {
  active: boolean = false;

  render() {
    const activeClass = this.active ? "active" : "inactive";

    return (
      <Host class={`card ${activeClass}`}>
        <header>
          <slot name="header" />
        </header>
        <main class="card-body">
          <slot />
        </main>
        <footer>
          <slot name="footer" />
        </footer>
      </Host>
    );
  }
}
