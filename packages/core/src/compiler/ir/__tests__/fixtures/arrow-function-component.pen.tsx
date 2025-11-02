/// <reference types="@pencel/runtime" />

export class ArrowFunctionComponent {
  items: string[] = ["apple", "banana", "cherry"];
  multiplier: number = 2;

  render() {
    return (
      <div>
        {this.items.map((item) => (
          <div key={item} class="item">
            {item.toUpperCase()}
          </div>
        ))}
        {this.items
          .filter((item) => item.length > 5)
          .map((item) => (
            <span key={item}>{item}</span>
          ))}
        {[1, 2, 3].map((num) => (
          <p key={num}>{num * this.multiplier}</p>
        ))}
      </div>
    );
  }
}
