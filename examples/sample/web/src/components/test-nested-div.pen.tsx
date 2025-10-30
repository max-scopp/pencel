import { Component, type ComponentInterface } from "@pencel/runtime";

@Component({
  tag: "test-nested-div",
})
export class TestNestedDiv extends HTMLElement implements ComponentInterface {
  render() {
    return (
      <div>
        <span>Content</span>
      </div>
    );
  }
}
