import {
  Component,
  type ComponentInterface,
  Host,
  Prop,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "todo-item",
})
export class HTMLTodoItemElement
  extends HTMLElement
  implements ComponentInterface
{
  @Prop() text: string = "";
  @Prop() completed: boolean = false;

  render() {
    return (
      <Host>
        <div className="todo-item">
          <input type="checkbox" checked={this.completed} />
          <span className={this.completed ? "completed" : ""}>{this.text}</span>
        </div>
      </Host>
    );
  }
}
