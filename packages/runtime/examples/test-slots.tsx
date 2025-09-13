// biome-ignore lint/correctness/noUnusedImports: Components used in JSX
import {
  Component,
  type ComponentInterface,
  Host,
  type JSXElement,
  render,
} from "../src";

// Test component with shadow DOM (should work natively)
@Component({
  tag: "shadow-slot-test",
  shadow: true,
})
class ShadowSlotTest extends HTMLElement implements ComponentInterface {
  render(): JSXElement {
    return (
      <Host>
        <div>Before slot content</div>
        <slot></slot>
        <div>After slot content</div>
      </Host>
    );
  }
}

// Test component without shadow DOM (needs custom slot handling)
@Component({
  tag: "no-shadow-slot-test",
  shadow: false,
})
class NoShadowSlotTest extends HTMLElement implements ComponentInterface {
  render(): JSXElement {
    return (
      <Host>
        <div>Before slot content</div>
        <slot></slot>
        <div>After slot content</div>
      </Host>
    );
  }
}

// Test app
const app = (
  <div style="padding: 20px;">
    <h1>Slot Testing</h1>
    
    <h2>Shadow DOM Component (should work)</h2>
    <shadow-slot-test>
      <p>This content should appear in the slot</p>
    </shadow-slot-test>
    
    <h2>Non-Shadow DOM Component (needs fix)</h2>
    <no-shadow-slot-test>
      <p>This content should also appear in the slot</p>
    </no-shadow-slot-test>
  </div>
);

// Render the test
const root = document.getElementById("root");
if (root) {
  render(app, root);
}