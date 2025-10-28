import {
  Component,
  type ComponentInterface,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "test-nested-div",
})
export class TestNestedDiv extends HTMLElement implements ComponentInterface {
  render(): VNode {
    return (
      <div>
        <span>Content</span>
      </div>
    );
  }
}
