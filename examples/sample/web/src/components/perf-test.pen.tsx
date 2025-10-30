import {
  Component,
  type ComponentInterface,
  Host,
  State,
} from "@pencel/runtime";

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

    // Shuffle every second
    this.#intervalId = window.setInterval(() => {
      this.items = this.#shuffle([...this.items]);
      this.renderCount++;
    }, 5000);
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

          <ul class="perf-list">
            {this.items.map((item) => (
              <li key={item.id} class="perf-item">
                <span class="item-id">{item.id}</span>
                <span class="item-value">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </Host>
    );
  }
}

// CSS for styling
const styles = `
  .perf-test-container {
    padding: 2rem;
    font-family: monospace;
  }

  .stats {
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .stats p {
    margin: 0.5rem 0;
    font-size: 0.95rem;
  }

  .perf-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
    max-height: 600px;
    overflow-y: auto;
    border: 1px solid #ccc;
    padding: 0.5rem;
  }

  .perf-item {
    padding: 0.5rem;
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 2px;
    font-size: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item-id {
    font-weight: bold;
    color: #333;
  }

  .item-value {
    color: #666;
    font-size: 0.7rem;
  }
`;
