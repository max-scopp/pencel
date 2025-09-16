import {
  Component,
  type ComponentInterface,
  // biome-ignore lint/correctness/noUnusedImports: <explanation>
  h,
  Prop,
  render,
  State,
} from "../../src/index.ts";

@Component({
  tag: "counter-component",
})
class CounterComponent extends HTMLElement implements ComponentInterface {
  @State()
  count = 0;

  @Prop({ reflect: true, type: Number })
  step = 1;

  @Prop({})
  title = "Counter 12312323";

  constructor() {
    super();
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

  componentDidRender() {
    console.log(`CounterComponent rendered with count: ${this.count}`);
  }

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
  tag: "user-card",
})
class UserCard extends HTMLElement {
  @Prop({ reflect: true })
  name = "";

  @Prop({})
  email = "";

  @State()
  isEditing = false;

  @State()
  tempName = "";

  @State()
  tempEmail = "";

  constructor() {
    super();
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

  componentDidRender() {
    console.log(`UserCard rendered for ${this.name}`);
  }

  render() {
    const UserInformation = () => {
      if (this.isEditing) {
        return (
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
        );
      }

      return (
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
      );
    };

    return (
      <div class="user-card">
        <h3>User Information</h3>
        <UserInformation />
      </div>
    );
  }
}

// Example usage
const app = (
  <div class="container">
    <h1>Pencil Props & State Example</h1>

    <h2>Counter with Props and State</h2>
    <pen-counter-component
      title="Another Counter 333"
      step="2"
    />

    <pen-counter-component
      title="Another Counter 111"
      step="5"
    />

    <h2>User Card with Reactive Props and State</h2>
    <pen-user-card name="John Doe" email="john@example.com" />
    <pen-user-card name="Jane Smith" email="jane@example.com" />

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
