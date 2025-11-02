/// <reference types="@pencel/runtime" />

export class AttributeVariationsComponent {
  inputValue: string = "default";
  isChecked: boolean = true;
  count: number = 5;
  placeholder: string = "Enter text";

  render() {
    const inputId = `input-${this.count}`;
    const maxLength = this.count * 10;

    return (
      <div>
        <input
          id={inputId}
          type="text"
          value={this.inputValue}
          placeholder={this.placeholder}
          maxLength={maxLength}
          aria-label={`Input ${this.count}`}
        />
        <input type="checkbox" checked={this.isChecked} />
        <progress value={this.count} max="10" />
      </div>
    );
  }
}
