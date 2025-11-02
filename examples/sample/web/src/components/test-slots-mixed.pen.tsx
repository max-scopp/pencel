import { Component, type ComponentInterface, Host } from "@pencel/runtime";

/**
 * Tests combination of named slots and default slots in one component.
 * Verifies that default slot acts as catch-all and named slots are independent.
 */
@Component({
  tag: "test-slots-mixed",
  styles: `
    :host {
      display: block;
      margin: 1rem 0;
    }
    .mixed-layout {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 1rem;
      background: #fafafa;
    }
    .primary-section, .secondary-section, .default-section, .optional-section {
      margin: 0.5rem 0;
      padding: 0.75rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 3px;
    }
    h3, h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }
    .default-slot-wrapper {
      background: #f9f9f9;
      padding: 0.5rem;
      border-radius: 2px;
    }
    ::slotted(*) {
      margin: 0.25rem 0;
    }
  `,
})
export class TestSlotsMixed extends HTMLElement implements ComponentInterface {
  render() {
    return (
      <Host class="test-slots-mixed">
        <div class="mixed-layout">
          <section class="primary-section">
            <h3>Primary Slot (Named)</h3>
            <slot name="primary">
              <div style="margin: 0; color: #999;">Primary fallback</div>
            </slot>
          </section>

          <section class="secondary-section">
            <h3>Secondary Slot (Named)</h3>
            <slot name="secondary">
              <div style="margin: 0; color: #999;">Secondary fallback</div>
            </slot>
          </section>

          <section class="default-section">
            <h3>Default Slot (Catch-all)</h3>
            <div class="default-slot-wrapper">
              <slot>
                <div style="margin: 0; color: #999;">No default content provided</div>
              </slot>
            </div>
          </section>

          <section class="optional-section">
            <h3>Optional Named Slot</h3>
            <slot name="optional">
              <div style="margin: 0; color: #999;">Optional slot not used</div>
            </slot>
          </section>
        </div>
      </Host>
    );
  }
}
