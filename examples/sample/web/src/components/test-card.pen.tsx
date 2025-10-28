import {
  Component,
  type ComponentInterface,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "test-card",
})
export class TestCard extends HTMLElement implements ComponentInterface {
  render(): VNode {
    return (
      <div class="card">
        <h2>Title</h2>
        <p>Content here</p>
      </div>
    );
  }
}
