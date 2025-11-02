import { Component, type ComponentInterface, Host } from "@pencel/runtime";

/**
 * Tests basic default slot and fallback content.
 */
@Component({
  tag: "test-slots-basic",
  styles: `
    :host {
      display: block;
      margin: 1rem 0;
    }
    .slot-container {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 1rem;
      background: #fafafa;
    }
    h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }
    ::slotted(*) {
      margin: 0.5rem 0;
    }
  `,
})
export class TestSlotsBasic extends HTMLElement implements ComponentInterface {
  render() {
    return (
      <Host class="test-slots-basic">
        <div class="slot-container">
          <h3>Default Slot with Fallback</h3>
          <slot>
            <p class="fallback-content">This is fallback content - shown when no children provided</p>
          </slot>
        </div>
      </Host>
    );
  }
}
