/// <reference types="@pencel/runtime" />

interface MenuItem {
  id: string;
  label: string;
  children?: MenuItem[];
}

export class NestedMapComponent {
  items: MenuItem[] = [
    {
      id: "menu-1",
      label: "File",
      children: [
        { id: "new", label: "New" },
        { id: "open", label: "Open" },
      ],
    },
    {
      id: "menu-2",
      label: "Edit",
      children: [
        { id: "cut", label: "Cut" },
        { id: "copy", label: "Copy" },
      ],
    },
  ];

  render() {
    return (
      <div class="menu">
        {this.items.map((item) => (
          <div key={item.id} class="menu-group">
            <h3>{item.label}</h3>
            {item.children && (
              <ul>
                {item.children.map((child) => (
                  <li key={child.id}>{child.label}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }
}
