import { renderVNode } from "../../src/core/vdom/renderVNode";

export function consecutiveUpdates(container: HTMLElement) {
  let vnode = <div id="update">First render</div>;

  renderVNode(vnode, container);

  setTimeout(() => {
    vnode = <div id="update">Second render</div>;
    renderVNode(vnode, container);
  }, 2e3);
}
