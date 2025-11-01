/// <reference types="@pencel/runtime" />

interface Props {
  text: string;
  completed: boolean;
}

export class TodoItem {
  text: string;
  completed: boolean;

  constructor(props: Props) {
    this.text = props.text;
    this.completed = props.completed;
  }

  render() {
    return (
      <div class={this.completed ? "todo-completed" : "todo-pending"}>
        <input type="checkbox" checked={this.completed} />
        <span>{this.text}</span>
      </div>
    );
  }
}
