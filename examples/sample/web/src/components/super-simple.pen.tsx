import { Component, type ComponentInterface } from "@pencel/runtime";

@Component({
  tag: "super-simple",
})
export class SuperSimple extends HTMLElement implements ComponentInterface {
  render() {
    return <div>Test</div>;
  }
}
