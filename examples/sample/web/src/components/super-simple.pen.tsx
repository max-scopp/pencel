import {
  Component,
  type ComponentInterface,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "super-simple",
})
export class SuperSimple extends HTMLElement implements ComponentInterface {
  render() {
    return <div>Test</div>;
  }
}
