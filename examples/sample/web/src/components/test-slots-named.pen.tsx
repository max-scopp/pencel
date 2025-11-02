import { Component, type ComponentInterface, Host } from "@pencel/runtime";

/**
 * Tests multiple named slots with individual fallback content.
 */
@Component({
  tag: "test-slots-named",
  styles: `
    :host {
      display: block;
      margin: 1rem 0;
    }
    .card-layout {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 1rem;
      background: #fafafa;
    }
    .card-header, .card-body, .card-footer, .card-sidebar {
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
    ::slotted(*) {
      margin: 0.25rem 0;
    }
  `,
})
export class TestSlotsNamed extends HTMLElement implements ComponentInterface {
  render() {
    return (
      <Host class="test-slots-named">
        <div class="card-layout">
          <header class="card-header">
            <slot name="header">
              <h4 style="margin: 0; color: #999;">Default Header</h4>
            </slot>
          </header>

          <div style="outline: 2px dashed red; padding: 0.5rem; margin: 0.5rem 0;">
            <p>Default Slot</p>
            <slot></slot>
          </div>

          <main class="card-body">
            <slot name="content">
              <p style="margin: 0; color: #999;">Default body content goes here</p>
            </slot>
          </main>

          <footer class="card-footer">
            <slot name="footer">
              <p style="margin: 0; color: #999;">Default footer</p>
            </slot>
          </footer>

          <aside class="card-sidebar">
            <slot name="sidebar">
              <p style="margin: 0; color: #999;">No sidebar provided</p>
            </slot>
          </aside>
        </div>
      </Host>
    );
  }
}
