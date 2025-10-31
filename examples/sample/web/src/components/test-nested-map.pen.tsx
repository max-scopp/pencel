import {
  Component,
  type ComponentInterface,
  Host,
  State,
} from "@pencel/runtime";

interface Item {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

@Component({
  tag: "test-nested-map",
})
export class TestNestedMap extends HTMLElement implements ComponentInterface {
  @State()
  items: Item[] = [
    {
      id: "item-1",
      name: "Category 1",
      children: [
        { id: "child-1-1", name: "Item 1.1" },
        { id: "child-1-2", name: "Item 1.2" },
      ],
    },
    {
      id: "item-2",
      name: "Category 2",
      children: [
        { id: "child-2-1", name: "Item 2.1" },
        { id: "child-2-2", name: "Item 2.2" },
      ],
    },
  ];

  render() {
    return (
      <Host>
        <div>
          {this.items.map((item) => (
            <div key={item.id}>
              <h3>{item.name}</h3>
              <ul>
                {item.children.map((child) => (
                  <li>{child.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
