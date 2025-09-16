import { render } from "../../src/index.ts";
import { h } from "../../src/index.ts";

// Define custom element
class MxCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 16px;
        margin: 8px;
      }
      .title { font-weight: bold; }
    `;
    shadow.appendChild(style);
  }

  static get observedAttributes() {
    return ["title"];
  }

  attributeChangedCallback(name: string, _: string, newValue: string) {
    if (name === "title") {
      const titleElm = this.shadowRoot?.querySelector(".title");
      if (titleElm) {
        titleElm.textContent = newValue;
      }
    }
  }

  connectedCallback() {
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = this.getAttribute("title") || "";
    this.shadowRoot?.appendChild(title);

    const slot = document.createElement("slot");
    this.shadowRoot?.appendChild(slot);
  }
}

customElements.define("mx-card", MxCard);

// Example using custom elements
const app = (
  <div class="container">
    <mx-card title="Custom Card 1">
      <p>This is a custom web component example.</p>
      <button type="button" onClick={() => alert("Card 1 clicked!")}>
        Action
      </button>
    </mx-card>

    <mx-card title="Custom Card 2">
      <p>Another custom card example with different content.</p>
      <div class="card-footer">
        <button type="button" onClick={() => alert("Card 2 clicked!")}>
          Click Me
        </button>
      </div>
    </mx-card>
  </div>
);

// Render to DOM
const root = document.getElementById("root");
if (root) {
  render(app, root);
}
