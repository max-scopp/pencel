/// <reference types="@pencel/runtime" />

export class TemplateStringComponent {
  userName: string = "Alice";
  userRole: string = "admin";
  itemCount: number = 42;

  render() {
    const ariaLabel = `User ${this.userName} with role ${this.userRole}`;
    const message = `You have ${this.itemCount} item${
      this.itemCount !== 1 ? "s" : ""
    }`;

    return (
      <div>
        <p>{message}</p>
        <button aria-label={ariaLabel}>Options</button>
        <span class={`badge badge-${this.userRole}`}>{this.userName}</span>
      </div>
    );
  }
}
