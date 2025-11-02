/// <reference types="@pencel/runtime" />
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */

interface Props {
  label: string;
  disabled: boolean;
}

export class SimpleButton {
  label: string;
  myDisabled: boolean;

  render() {
    return <button disabled={this.myDisabled}>{this.label}</button>;
  }
}
