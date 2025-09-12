import { render } from "../../src";

// Basic example using standard HTML elements
const app = (
  <div class="container">
    <h1>Hello, World!</h1>
    <p>This is a basic example using standard HTML elements.</p>
    <button onclick={() => alert("Clicked!")}>Click me</button>
  </div>
);

// Render to DOM
render(app, document.getElementById("root")!);
