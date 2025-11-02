import { Component, type ComponentInterface, Host } from "@pencel/runtime";

/**
 * Tests dynamic slot changes by allowing content to be added/removed.
 */
@Component({
  tag: "test-slots-dynamic",
  styles: `
    :host {
      display: block;
      margin: 1rem 0;
    }
    .dynamic-container {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 1rem;
      background: #fafafa;
    }
    .controls {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    button {
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    button:hover {
      background: #0056b3;
    }
    .slot-wrapper {
      border: 1px solid #e0e0e0;
      border-radius: 3px;
      padding: 0.75rem;
      background: white;
      margin-top: 0.5rem;
    }
    .status {
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 2px;
    }
    ::slotted(*) {
      margin: 0.25rem 0;
    }
  `,
})
export class TestSlotsDynamic extends HTMLElement implements ComponentInterface {
  appendItem() {
    const item = document.createElement("div");
    item.textContent = `Item added at ${new Date().toLocaleTimeString()}`;
    item.style.cssText = "padding: 0.5rem; background: #e3f2fd; margin: 0.25rem 0; border-radius: 2px;";
    this.appendChild(item);
  }

  removeLastItem() {
    const items = Array.from(this.childNodes).filter((n) => n instanceof HTMLElement && !n.hasAttribute("slot"));
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      this.removeChild(lastItem);
    }
  }

  clearAll() {
    while (this.childNodes.length > 0) {
      this.removeChild(this.childNodes[0]);
    }
  }

  render() {
    const contentStatus = this.childNodes.length > 0 ? "Content present" : "No content (showing fallback)";

    return (
      <Host class="test-slots-dynamic">
        <div class="dynamic-container">
          <h3>Dynamic Slot Changes</h3>

          <div class="controls">
            <button onClick={() => this.appendItem()}>Add Item</button>
            <button onClick={() => this.removeLastItem()}>Remove Item</button>
            <button onClick={() => this.clearAll()}>Clear All</button>
          </div>

          <div class="slot-wrapper">
            <slot>
              <p style="margin: 0; color: #999;">No content provided - showing fallback</p>
            </slot>
          </div>

          <div class="status">
            <strong>Status:</strong> {contentStatus} • {this.childNodes.length} child node(s)
          </div>
        </div>
      </Host>
    );
  }
}
