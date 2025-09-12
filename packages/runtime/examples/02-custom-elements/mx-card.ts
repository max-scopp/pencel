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
      this.shadowRoot?.querySelector('.title')?.textContent = newValue;
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
