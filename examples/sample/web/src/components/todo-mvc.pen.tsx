import {
  Component,
  type ComponentInterface,
  Event,
  type EventEmitter,
  Host,
  State,
} from "@pencel/runtime";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

@Component({
  tag: "todo-mvc",
  styleUrl: "./todo-mvc.scss",
})
export class TodoMvcElement extends HTMLElement implements ComponentInterface {
  @State() todos: Todo[] = [];
  @State() inputValue: string = "";

  @Event() declare todoAdded: EventEmitter<Todo>;
  @Event() declare todoToggled: EventEmitter<{
    id: string;
    completed: boolean;
  }>;
  @Event() declare todoDeleted: EventEmitter<string>;

  handleInputChange = (e: any) => {
    this.inputValue = (e.target as HTMLInputElement).value;
  };

  handleAddTodo = () => {
    if (this.inputValue.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: this.inputValue,
        completed: false,
      };
      this.todos = [...this.todos, newTodo];
      this.inputValue = "";
      this.todoAdded.emit(newTodo);
    }
  };

  handleToggleTodo = (id: string) => {
    this.todos = this.todos.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      this.todoToggled.emit({ id, completed: todo.completed });
    }
  };

  handleDeleteTodo = (id: string) => {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.todoDeleted.emit(id);
  };

  handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      this.handleAddTodo();
    }
  };

  render() {
    const completedCount = this.todos.filter((todo) => todo.completed).length;
    const remainingCount = this.todos.length - completedCount;

    return (
      <Host>
        <div class="todo-mvc-container">
          <h1>Todo MVC</h1>

          <div class="input-section">
            <input
              type="text"
              placeholder="Add a new todo..."
              value={this.inputValue}
              onInput={this.handleInputChange}
              onKeyPress={this.handleKeyPress}
              class="todo-input"
            />
            <button
              type="button"
              onClick={this.handleAddTodo}
              class="add-button"
            >
              Add Todo
            </button>
          </div>

          <div class="stats">
            <span>Total: {this.todos.length}</span>
            <span>Remaining: {remainingCount}</span>
            <span>Completed: {completedCount}</span>
          </div>

          <ul class="todo-list">
            {this.todos.map((todo) => (
              <li
                key={todo.id}
                class={`todo-item ${todo.completed ? "completed" : ""}`}
                style={{
                  textDecoration: todo.completed ? "line-through" : "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => this.handleToggleTodo(todo.id)}
                  class="todo-checkbox"
                />
                <span class="todo-text">{todo.text}</span>
                <button
                  type="button"
                  onClick={() => this.handleDeleteTodo(todo.id)}
                  class="delete-button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {this.todos.length === 0 && (
            <div class="empty-state">No todos yet. Add one to get started!</div>
          )}
        </div>
      </Host>
    );
  }
}
