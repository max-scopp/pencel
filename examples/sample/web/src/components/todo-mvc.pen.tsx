import {
  Component,
  type ComponentInterface,
  Event,
  type EventEmitter,
  State,
} from "@pencel/runtime";

type FilterType = "all" | "active" | "completed";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  editing: boolean;
}

/**
 * https://todomvc.com/examples/react/dist/
 */
@Component({
  tag: "todo-mvc",
  styleUrl: "./todo-mvc.scss",
})
export class TodoMvcElement extends HTMLElement implements ComponentInterface {
  @State() todos: Todo[] = [];
  @State() inputValue: string = "";
  @State() filter: FilterType = "all";
  @State() editingId: string | null = null;
  @State() editingText: string = "";

  @Event() declare todoAdded: EventEmitter<Todo>;
  @Event() declare todoToggled: EventEmitter<{
    id: string;
    completed: boolean;
  }>;
  @Event() declare todoDeleted: EventEmitter<string>;

  constructor() {
    super();
    this.loadTodos();
  }

  private loadTodos() {
    try {
      const stored = localStorage.getItem("todos-pencel");
      if (stored) {
        this.todos = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load todos", e);
    }
  }

  private saveTodos() {
    try {
      localStorage.setItem("todos-pencel", JSON.stringify(this.todos));
    } catch (e) {
      console.error("Failed to save todos", e);
    }
  }

  handleInputChange = (e: any) => {
    this.inputValue = (e.target as HTMLInputElement).value;
  };

  handleAddTodo = () => {
    const text = this.inputValue.trim();
    if (text.length === 0) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: text,
      completed: false,
      editing: false,
    };
    this.todos = [...this.todos, newTodo];
    this.inputValue = "";
    this.saveTodos();
    this.todoAdded.emit(newTodo);
  };

  handleToggleTodo = (id: string) => {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    );
    this.saveTodos();
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      this.todoToggled.emit({ id, completed: todo.completed });
    }
  };

  handleDeleteTodo = (id: string) => {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.saveTodos();
    this.todoDeleted.emit(id);
  };

  handleToggleAll = (e: any) => {
    const checked = (e.target as HTMLInputElement).checked;
    this.todos = this.todos.map((todo) => ({
      ...todo,
      completed: checked,
    }));
    this.saveTodos();
  };

  handleClearCompleted = () => {
    this.todos = this.todos.filter((todo) => !todo.completed);
    this.saveTodos();
  };

  handleStartEdit = (todo: Todo) => {
    this.editingId = todo.id;
    this.editingText = todo.title;
  };

  handleSaveEdit = (id: string) => {
    const text = this.editingText.trim();
    if (text.length === 0) {
      this.handleDeleteTodo(id);
      return;
    }
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, title: text, editing: false } : todo,
    );
    this.editingId = null;
    this.editingText = "";
    this.saveTodos();
  };

  handleCancelEdit = () => {
    this.editingId = null;
    this.editingText = "";
  };

  handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      this.handleAddTodo();
    }
  };

  handleEditKeyPress = (e: any, id: string) => {
    if (e.key === "Enter") {
      this.handleSaveEdit(id);
    } else if (e.key === "Escape") {
      this.handleCancelEdit();
    }
  };

  setFilter = (filter: FilterType) => {
    this.filter = filter;
  };

  private getFilteredTodos() {
    switch (this.filter) {
      case "active":
        return this.todos.filter((todo) => !todo.completed);
      case "completed":
        return this.todos.filter((todo) => todo.completed);
      default:
        return this.todos;
    }
  }

  render() {
    const filteredTodos = this.getFilteredTodos();
    const completedCount = this.todos.filter((todo) => todo.completed).length;
    const remainingCount = this.todos.length - completedCount;
    const allCompleted = this.todos.length > 0 && remainingCount === 0;

    return (
      <section class="todoapp">
        <header class="header">
          <h1>todos</h1>
          <input
            class="new-todo"
            placeholder="What needs to be done?"
            value={this.inputValue}
            onInput={this.handleInputChange}
            onKeyPress={this.handleKeyPress}
            autofocus
          />
        </header>

        {this.todos.length > 0 && (
          <>
            <section class="main">
              <input
                id="toggle-all"
                class="toggle-all"
                type="checkbox"
                checked={allCompleted}
                onChange={this.handleToggleAll}
              />
              <label for="toggle-all">Mark all as complete</label>
              <ul class="todo-list">
                {filteredTodos.map((todo) => (
                  <li
                    key={todo.id}
                    class={`${todo.completed ? "completed" : ""} ${
                      this.editingId === todo.id ? "editing" : ""
                    }`}
                  >
                    <div class="view">
                      <input
                        class="toggle"
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => this.handleToggleTodo(todo.id)}
                      />
                      <label onDblClick={() => this.handleStartEdit(todo)}>
                        {todo.title}
                      </label>
                      <button
                        class="destroy"
                        onClick={() => this.handleDeleteTodo(todo.id)}
                      />
                    </div>
                    {this.editingId === todo.id && (
                      <input
                        class="edit"
                        value={this.editingText}
                        onInput={(e: any) => {
                          this.editingText = e.target.value;
                        }}
                        onKeyPress={(e: any) =>
                          this.handleEditKeyPress(e, todo.id)
                        }
                        onBlur={() => this.handleSaveEdit(todo.id)}
                        autofocus
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <footer class="footer">
              <span class="todo-count">
                <strong>{remainingCount}</strong>
                <span> {remainingCount === 1 ? "item" : "items"} left</span>
              </span>
              <ul class="filters">
                <li>
                  <a
                    href="#/"
                    class={this.filter === "all" ? "selected" : ""}
                    onClick={() => this.setFilter("all")}
                  >
                    All
                  </a>
                </li>
                <li>
                  <a
                    href="#/active"
                    class={this.filter === "active" ? "selected" : ""}
                    onClick={() => this.setFilter("active")}
                  >
                    Active
                  </a>
                </li>
                <li>
                  <a
                    href="#/completed"
                    class={this.filter === "completed" ? "selected" : ""}
                    onClick={() => this.setFilter("completed")}
                  >
                    Completed
                  </a>
                </li>
              </ul>
              {completedCount > 0 && (
                <button
                  class="clear-completed"
                  onClick={this.handleClearCompleted}
                >
                  Clear completed
                </button>
              )}
            </footer>
          </>
        )}
      </section>
    );
  }
}
