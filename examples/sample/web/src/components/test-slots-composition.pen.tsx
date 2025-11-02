import { Component, type ComponentInterface, Host } from "@pencel/runtime";

/**
 * Tests slot composition with nested components consuming slots.
 * Useful for verifying that slots work across component boundaries.
 */
@Component({
  tag: "test-slots-composition",
  styles: `
    :host {
      display: block;
      margin: 1rem 0;
    }
    .composition-wrapper {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 1rem;
      background: #fafafa;
    }
    .outer-section, .inner-section {
      margin: 0.5rem 0;
      padding: 0.75rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 3px;
    }
    .inner-section {
      margin-left: 1rem;
      background: #f5f5f5;
    }
    h3, h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }
    ::slotted(*) {
      margin: 0.25rem 0;
    }
  `,
})
export class TestSlotsComposition extends HTMLElement implements ComponentInterface {
  render() {
    return (
      <Host class="test-slots-composition">
        <div class="composition-wrapper">
          <div class="outer-section">
            <h3>Outer Component Slot</h3>
            <slot name="outer-start">
              <div style="margin: 0; color: #999;">Outer start fallback</div>
            </slot>

            <div class="inner-section">
              <h4>Inner Component Slot (Nested)</h4>
              <slot name="inner">
                <div style="margin: 0; color: #999;">Inner fallback content</div>
              </slot>
            </div>

            <slot name="outer-end">
              <div style="margin: 0; color: #999;">Outer end fallback</div>
            </slot>
          </div>
        </div>
      </Host>
    );
  }
}
