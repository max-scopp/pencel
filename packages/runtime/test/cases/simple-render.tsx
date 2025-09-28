import { renderVNode } from "../../src/core/vdom/renderVNode";

export function simpleRender(container: HTMLElement) {
  const vnode = <div id="simple">Hello, world!</div>;
  renderVNode(vnode, container);
}
