import { Component, type ComponentInterface, Prop } from "@pencel/runtime";

@Component({
  tag: "test-features",
})
export class TestFeatures extends HTMLElement implements ComponentInterface {
  @Prop()
  name: string = "World";

  @Prop()
  count: number = 0;

  @Prop()
  active: boolean = false;

  handleClick = () => {
    console.log("Clicked!");
  };

  render() {
    const className = `test-${this.active ? "active" : "inactive"}`;

    return (
      <div class={className}>
        <h1>Hello {this.name}!</h1>
        <p>Count: {this.count}</p>
        <button onClick={this.handleClick}>Click me</button>
        {this.active && <span>Active!</span>}
        {this.count > 5 ? <strong>High count</strong> : <em>Low count</em>}
        <input type="text" placeholder="Enter text" />
      </div>
    );
  }
}
