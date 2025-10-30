import { Component, type ComponentInterface, State } from "@pencel/runtime";

interface Todo {
  id: string;
  text: string;
}

@Component({
  tag: "todo-list",
})
export class TodoListElement extends HTMLElement implements ComponentInterface {
  @State() todos: Todo[] = [
    { id: "1", text: "Buy milk" },
    { id: "2", text: "Walk dog" },
  ];

  render() {
    return (
      <div>
        <ul>
          {this.todos.map((todo) => (
            <li key={todo.id}>{todo.text}</li>
          ))}
        </ul>
      </div>
    );
  }
}
