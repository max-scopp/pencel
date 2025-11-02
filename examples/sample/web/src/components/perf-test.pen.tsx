import { Component, type ComponentInterface, Host, State } from "@pencel/runtime";

interface Item {
  id: string;
  value: number;
}

@Component({
  tag: "perf-test",
})
export class PerfTestElement extends HTMLElement implements ComponentInterface {
  @State() items: Item[] = [];
  @State() renderCount: number = 0;

  #intervalId: number | null = null;

  componentDidLoad() {
    // Generate 1k items
    this.items = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      value: i,
    }));

    // Shuffle every second and randomize colors
    this.#intervalId = window.setInterval(() => {
      this.items = this.#shuffle([...this.items]);

      this.items = this.items.map((item) => ({
        ...item,
      }));

      this.renderCount++;
    }, 3000);
  }

  componentWillUnmount() {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
    }
  }

  #shuffle(array: Item[]): Item[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  render() {
    return (
      <Host>
        <div class="perf-test-container">
          <h1>Performance Test: 1k Items</h1>
          <div class="stats">
            <p>Items: {this.items.length}</p>
            <p>Render Count: {this.renderCount}</p>
          </div>

          <ul class="perf-list" style={{ display: "flex", flexFlow: "row wrap" }}>
            {this.items.map((item) => (
              <li
                class="perf-item"
                style={{
                  backgroundColor: `hsl(${item.value % 360}, 70%, 50%)`,
                  width: "20px",
                  height: "20px",
                  listStyle: "none",
                  fontSize: "10px",
                }}
              >
                {item.value}
              </li>
            ))}
          </ul>
        </div>
      </Host>
    );
  }
}
