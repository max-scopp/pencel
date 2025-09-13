import { type FunctionalComponent, render } from "../../src";
import { h } from "../../src/index";

// Define custom element
class MxCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 16px;
        margin: 8px;
      }
      .title { font-weight: bold; }
    `;
    shadow.appendChild(style);
  }

  static get observedAttributes() {
    return ["title"];
  }

  attributeChangedCallback(name: string, _: string, newValue: string) {
    if (name === "title") {
      const titleElm = this.shadowRoot?.querySelector(".title");
      if (titleElm) {
        titleElm.textContent = newValue;
      }
    }
  }

  connectedCallback() {
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = this.getAttribute("title") || "";
    this.shadowRoot?.appendChild(title);

    const slot = document.createElement("slot");
    this.shadowRoot?.appendChild(slot);
  }
}

customElements.define("mx-card", MxCard);

// Global state
const globalState: Record<string, unknown> = {};
let renderScheduled = false;

// Utility function for state management (simple implementation)
function useState<T>(initial: T, key: string): [T, (value: T) => void] {
  if (!(key in globalState)) {
    globalState[key] = initial;
  }
  const state = globalState[key] as T;
  const setState = (value: T) => {
    globalState[key] = value;
    // Schedule render to batch multiple state updates
    if (!renderScheduled) {
      renderScheduled = true;
      requestAnimationFrame(() => {
        renderApp();
        renderScheduled = false;
      });
    }
  };
  return [state, setState];
}

// Theme context (simplified)
const ThemeContext = {
  current: "light",
  toggle: () => {
    ThemeContext.current = ThemeContext.current === "light" ? "dark" : "light";
    document.body.className = ThemeContext.current;
  },
};

// Functional component with props
interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Tab: FunctionalComponent<TabProps> = ({
  label,
  isActive,
  onClick,
}: TabProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`tab ${isActive ? "active" : ""}`}
  >
    {label}
  </button>
);

// Component with children
interface TabPanelProps {
  isActive: boolean;
}

const TabPanel: FunctionalComponent<TabPanelProps> = (
  { isActive }: TabPanelProps,
  children,
) => <div className={`tab-panel ${isActive ? "active" : ""}`}>{children}</div>;

// Complex component with state
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

const TodoList: FunctionalComponent = () => {
  const [todos, setTodos] = useState<TodoItem[]>([], "todos");
  const [input, setInput] = useState("", "input");

  const addTodo = () => {
    if (input.trim()) {
      const newTodos = [
        ...todos,
        { id: Date.now(), text: input, completed: false },
      ];
      setTodos(newTodos);
      setInput("");
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  return (
    <div className="todo-list">
      <div className="todo-input">
        <input
          type="text"
          value={input}
          onInput={(e: Event) => setInput((e.target as HTMLInputElement).value)}
          placeholder="Add a todo"
        />
        <button type="button" onClick={addTodo}>
          Add
        </button>
      </div>

      <ul>
        {(() => {
          const todoElements = todos.map((todo) => (
            <li
              key={todo.id}
              className={todo.completed ? "completed" : ""}
              onClick={() => toggleTodo(todo.id)}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "Enter") toggleTodo(todo.id);
              }}
            >
              {todo.text}
            </li>
          ));
          return todoElements;
        })()}
      </ul>
    </div>
  );
};

// Main App combining everything
const App: FunctionalComponent = () => {
  const [activeTab, setActiveTab] = useState(0, "activeTab");
  const tabs = ["Todo List", "Custom Elements", "Info"];

  return (
    <div className={`app ${ThemeContext.current}`}>
      <header className="header">
        <h1>Complex JSX Example</h1>
        <button type="button" onClick={ThemeContext.toggle}>
          Toggle Theme
        </button>
      </header>

      <nav className="tabs">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab}
            isActive={activeTab === index}
            onClick={() => setActiveTab(index)}
          />
        ))}
      </nav>

      <main className="content">
        <TabPanel isActive={activeTab === 0}>
          <TodoList />
        </TabPanel>

        <TabPanel isActive={activeTab === 1}>
          <mx-card title="Custom Web Component">
            <p>This is a custom element example within the app.</p>
            <button
              type="button"
              onClick={() => alert("Custom element clicked!")}
            >
              Interact
            </button>
          </mx-card>
        </TabPanel>

        <TabPanel isActive={activeTab === 2}>
          <div className="info-panel">
            <h2>About This Example</h2>
            <p>This example demonstrates:</p>
            <ul>
              <li>Functional Components</li>
              <li>Custom Elements</li>
              <li>State Management</li>
              <li>Event Handling</li>
              <li>Conditional Rendering</li>
              <li>List Rendering</li>
              <li>Theme Switching</li>
            </ul>
          </div>
        </TabPanel>
      </main>
    </div>
  );
};

// Initial render
const root = document.getElementById("root");

const renderApp = () => {
  render(<App />, root);
};

renderApp();
