import {
  Component,
  type ComponentInterface,
  Event,
  Host,
  Prop,
  State,
  type VNode,
} from "@pencel/runtime";

@Component({
  tag: "pen-input",
})
export class PenInputElement extends HTMLElement implements ComponentInterface {
  @Prop() type: "text" | "email" | "password" | "number" = "text";
  @Prop() placeholder: string = "";
  @Prop() label: string = "";
  @Prop() disabled: boolean = false;
  @Prop() required: boolean = false;
  @Prop() error: boolean = false;
  @Prop() errorMessage: string = "";
  @Prop() size: "sm" | "md" | "lg" = "md";

  @State() focused: boolean = false;
  @State() value: string = "";

  @Event() valueChange: CustomEvent<string>;

  handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
  };

  handleFocus = () => {
    this.focused = true;
  };

  handleBlur = () => {
    this.focused = false;
  };

  render(): VNode {
    const sizeClass = `input-size-${this.size}`;
    const stateClass = this.error
      ? "input-error"
      : this.focused
        ? "input-focused"
        : "";

    return (
      <Host class={`pen-input ${sizeClass} ${stateClass}`}>
        {this.label && <label class="input-label">{this.label}</label>}
        <input
          type={this.type}
          placeholder={this.placeholder}
          disabled={this.disabled}
          required={this.required}
          onInput={this.handleInput}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          value={this.value}
          aria-label={this.label || this.placeholder}
          aria-invalid={this.error}
        />
        {this.error && this.errorMessage && (
          <span class="input-error-message">{this.errorMessage}</span>
        )}
      </Host>
    );
  }
}
