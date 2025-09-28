import { renderVNode } from "../../src/core/vdom/renderVNode";

export function slotRender(container: HTMLElement) {
  const vnode = (
    <div>
      <slot name="header">Default Header</slot>
      <slot></slot>
      <span>Custom Content</span>
    </div>
  );
  renderVNode(vnode, container);
}
