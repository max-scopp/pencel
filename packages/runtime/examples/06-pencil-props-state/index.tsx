// biome-ignore lint/correctness/noUnusedImports: JSX imports needed for runtime
import { Component, h, Prop, render, State } from "../../src";

@Component({
  tagName: "counter-component",
})
class CounterComponent extends HTMLElement {
  @State()
  count = 0;

  @Prop({ reflect: true, type: Number, defaultValue: 1 })
  step: number;

  @Prop({ defaultValue: "Counter" })
  title: string;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  increment = () => {
    this.count += this.step;
  };

  decrement = () => {
    this.count -= this.step;
  };

  reset = () => {
    this.count = 0;
  };

  render() {
    return (
      <div class="counter">
        <h3>{this.title}</h3>
        <div class="count">{this.count}</div>
        <div>
          <button type="button" onClick={this.decrement}>
            -
          </button>
          <button type="button" onClick={this.reset}>
            Reset
          </button>
          <button type="button" onClick={this.increment}>
            +
          </button>
        </div>
        <div>Step: {this.step}</div>
      </div>
    );
  }
}

@Component({
  tagName: "user-card",
})
class UserCard extends HTMLElement {
  @Prop({ reflect: true, defaultValue: "" })
  name: string;

  @Prop({ defaultValue: "" })
  email: string;

  @State()
  isEditing = false;

  @State()
  tempName = "";

  @State()
  tempEmail = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.tempName = this.name;
    this.tempEmail = this.email;
  }

  startEdit = () => {
    this.isEditing = true;
    this.tempName = this.name;
    this.tempEmail = this.email;
  };

  saveEdit = () => {
    this.name = this.tempName;
    this.email = this.tempEmail;
    this.isEditing = false;
  };

  cancelEdit = () => {
    this.isEditing = false;
    this.tempName = this.name;
    this.tempEmail = this.email;
  };

  handleNameChange = (event: Event) => {
    this.tempName = (event.target as HTMLInputElement).value;
  };

  handleEmailChange = (event: Event) => {
    this.tempEmail = (event.target as HTMLInputElement).value;
  };

  render() {
    return (
      <div class="user-card">
        <h3>User Information</h3>
        {this.isEditing ? (
          <div>
            <input
              type="text"
              value={this.tempName}
              onInput={this.handleNameChange}
              placeholder="Name"
            />
            <input
              type="email"
              value={this.tempEmail}
              onInput={this.handleEmailChange}
              placeholder="Email"
            />
            <div>
              <button type="button" onClick={this.saveEdit}>
                Save
              </button>
              <button type="button" onClick={this.cancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div class="info">
            <p>
              <strong>Name:</strong> {this.name || "Not set"}
            </p>
            <p>
              <strong>Email:</strong> {this.email || "Not set"}
            </p>
            <button type="button" onClick={this.startEdit}>
              Edit
            </button>
          </div>
        )}
      </div>
    );
  }
}

// Example usage
const app = (
  <div class="container">
    <h1>Pencil Props & State Example</h1>

    <h2>Counter with Props and State</h2>
    <pen-counter-component title="My Counter" step="2"></pen-counter-component>
    <pen-counter-component
      title="Another Counter"
      step="5"
    ></pen-counter-component>

    <h2>User Card with Reactive Props and State</h2>
    <pen-user-card name="John Doe" email="john@example.com"></pen-user-card>
    <pen-user-card name="Jane Smith" email="jane@example.com"></pen-user-card>

    <h2>Dynamic Updates</h2>
    <p>Open browser console and try:</p>
    <ul>
      <li>
        <code>document.querySelector('pen-counter-component').step = 10</code>
      </li>
      <li>
        <code>
          document.querySelector('pen-user-card').name = 'Updated Name'
        </code>
      </li>
    </ul>
  </div>
);

// Render to DOM
const root = document.getElementById("root");
if (root) {
  render(app, root);
}
