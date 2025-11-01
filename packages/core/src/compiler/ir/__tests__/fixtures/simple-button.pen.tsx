/// <reference types="@pencel/runtime" />

interface Props {
  label: string;
  disabled: boolean;
}

export class SimpleButton {
  label: string;
  disabled: boolean;

  constructor(props: Props) {
    this.label = props.label;
    this.disabled = props.disabled;
  }

  render() {
    return <button disabled={this.disabled}>{this.label}</button>;
  }
}
