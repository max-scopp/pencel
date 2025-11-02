import { Host } from "../../src/core/jsx/jsx-helpers.ts";
import { renderVNode } from "../../src/core/vdom/renderVNode";

export function customElementRender(container: HTMLElement) {
  const vnode = (
    <Host data-host={true}>
      <span>Inside Host</span>
    </Host>
  );

  renderVNode(vnode, container);
}
