import {
  type CacheOwner,
  cacheLexer,
  createLexerCache,
  setChildren,
  setProps,
  setText,
} from "./zero-dom";

// --- Todo Item Component ---
export function TodoItem(
  this: CacheOwner,
  props: { id: string; text: string; completed: boolean },
) {
  /*

   return (
     <li>
       <input type="checkbox" checked={props.completed} />
       <span>{props.text}</span>
     </li>
   )

   */
  const once = this[cacheLexer]!;

  const li = once(`li_${props.id}`, () => document.createElement("li"));

  const checkbox = once(`chk_${props.id}`, () =>
    document.createElement("input"),
  );
  setProps(checkbox, { type: "checkbox" });
  checkbox.checked = props.completed;

  const label = once(`lbl_${props.id}`, () => document.createElement("span"));
  const textNode = once(`text_lbl_${props.id}`, () =>
    document.createTextNode(props.text),
  );
  setText(textNode, props.text);
  setChildren(label, [textNode]);

  setChildren(li, [checkbox, label]);
  return li;
}

// --- Todo App Custom Element ---
class TodoApp extends HTMLElement implements CacheOwner {
  [cacheLexer] = createLexerCache();

  todos: { id: string; text: string; completed: boolean }[] = [];
  newTodoText = "";

  connectedCallback() {
    this.render();
  }

  render() {
    /*

    return ( 
        <div className="todo-app">
          <h1>TodoMVC</h1>
          <input
            placeholder="Add todo..."
            value={this.newTodoText}
            oninput={e => (this.newTodoText = (e.target as HTMLInputElement).value)}
          />
          <button
            onclick={() => {
              if (this.newTodoText.trim()) {
                const id = Math.random().toString(36).slice(2);
                this.todos.push({ id, text: this.newTodoText, completed: false });
                this.newTodoText = "";
                this.render();
              }
            }}
          >
            Add
          </button>
          <ul>
            {this.todos.map(t => TodoItem(t))}
          </ul>
        </div>
    )

    */
    const once = this[cacheLexer]!;

    const root = once("root", () => document.createElement("div"));
    setProps(root, { className: "todo-app" });

    const h1 = once("h1", () => document.createElement("h1"));
    const h1Text = once("text_h1", () => document.createTextNode("TodoMVC"));
    setText(h1Text, "TodoMVC");
    setChildren(h1, [h1Text]);

    const input = once("input", () => document.createElement("input"));
    setProps(input, { placeholder: "Add todo..." });
    input.value = this.newTodoText;
    input.oninput = (e: Event) => {
      this.newTodoText = (e.target as HTMLInputElement).value;
    };

    const addBtn = once("btn", () => document.createElement("button"));
    const btnText = once("text_btn", () => document.createTextNode("Add"));
    setChildren(addBtn, [btnText]);
    addBtn.onclick = () => {
      if (this.newTodoText.trim()) {
        const id = Math.random().toString(36).slice(2);
        this.todos.push({ id, text: this.newTodoText, completed: false });
        this.newTodoText = "";
        this.render();
      }
    };

    const ul = once("ul", () => document.createElement("ul"));
    const items: HTMLElement[] = [];
    for (const t of this.todos) {
      items.push(
        TodoItem.call(this, { id: t.id, text: t.text, completed: t.completed }),
      );
    }
    setChildren(ul, items);

    setChildren(root, [h1, input, addBtn, ul]);
    setChildren(this, [root]);
  }
}

customElements.define("todo-app", TodoApp);
