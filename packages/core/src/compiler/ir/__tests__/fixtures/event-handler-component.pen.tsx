/// <reference types="@pencel/runtime" />

export class EventHandlerComponent {
  count: number = 0;
  name: string = "";

  handleClick = () => {
    this.count++;
  };

  handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.name = target.value;
  };

  handleChange = (e: Event) => {
    console.log("Changed");
  };

  render() {
    return (
      <div>
        <button onClick={this.handleClick}>Count: {this.count}</button>
        <input
          type="text"
          onInput={this.handleInput}
          onChange={this.handleChange}
          value={this.name}
        />
      </div>
    );
  }
}
