import { render } from "../../src";
import { h } from "../../src/index";

// Basic example using standard HTML elements
const app1 = (
  <div class="container">
    <h1>Hello, World!</h1>
    <p>This is the first render call.</p>
    <button type="button" onClick={() => alert("Clicked!")}>
      Click me
    </button>
  </div>
);

const app2 = (
  <div class="container">
    <h1>Hello Again!</h1>
    <p>This is the second render call.</p>
    <button type="button" onClick={() => alert("Clicked again!")}>
      Click me
    </button>
  </div>
);

// Render to DOM
const root = document.getElementById("root");
if (root) {
  render(app1, root);

  // Test multiple renders
  setTimeout(() => {
    render(app2, root);
  }, 1000);

  setTimeout(() => {
    render(app1, root);
  }, 2000);
}
