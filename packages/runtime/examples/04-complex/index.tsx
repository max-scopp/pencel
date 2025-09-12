import { type Component, render } from "../../src";
import "../02-custom-elements/mx-card";
import { h } from "../../src/index"

// Utility function for state management (simple implementation)
function useState<T>(initial: T): [T, (value: T) => void] {
  let state = initial;
  const setState = (value: T) => {
    state = value;
    renderApp(); // Re-render the app when state changes
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

const Tab: Component = ({ label, isActive, onClick }: TabProps) => (
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
  children: unknown;
  isActive: boolean;
}

const TabPanel: Component = ({ children, isActive }: TabPanelProps) => (
  <div className={`tab-panel ${isActive ? "active" : ""}`}>{children}</div>
);

// Complex component with state
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

const TodoList: Component = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
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
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={todo.completed ? "completed" : ""}
            onClick={() => toggleTodo(todo.id)}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Main App combining everything
const App: Component = () => {
  const [activeTab, setActiveTab] = useState(0);
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
if (root) {
  const renderApp = () => {
    render(<App />, root);
  };
  renderApp();
}
