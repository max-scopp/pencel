import { render } from "../../src";
import "./mx-card";

// Example using custom elements
const app = (
  <div className="container">
    <mx-card title="Custom Card 1">
      <p>This is a custom web component example.</p>
      <button type="button" onClick={() => alert("Card 1 clicked!")}>
        Action
      </button>
    </mx-card>

    <mx-card title="Custom Card 2">
      <p>Another custom card example with different content.</p>
      <div className="card-footer">
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
