// biome-ignore lint/correctness/noUnusedImports: Components used in JSX
import {
  Component,
  type ComponentInterface,
  Host,
  h,
  type JSXElement,
  render,
} from "../../src/index.ts";

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
        <slot />
        <div>After slot content</div>
        <slot name="after" />
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
        <slot />
        <div>After slot content</div>
        <slot name="after" />
      </Host>
    );
  }
}
