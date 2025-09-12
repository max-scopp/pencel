// biome-ignore lint/correctness/noUnusedImports: <explanation>
import { h, render } from "@pencil/runtime";

// Test multiple render calls
const app1 = (
  <div class="container">
    <h1>First Render</h1>
    <p>This is the first render call.</p>
  </div>
);

const app2 = (
  <div class="container">
    <h1>Second Render</h1>
    <p>This is the second render call.</p>
  </div>
);

// Render multiple times to test performance tracking
const root = document.getElementById("root");
if (root) {
  render(app1, root);

  // Wait a bit and render again
  setTimeout(() => {
    render(app2, root);
  }, 100);

  // And again
  setTimeout(() => {
    render(app1, root);
  }, 200);
}
