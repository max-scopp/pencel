import type { ComponentInterface } from '@stencil/core';
import { Component, Host, h } from '@stencil/core';

import { getIonMode } from "../../global/ionic-global.ts";

@Component({
  tag: 'ion-avatar',
  styleUrls: {
    ios: 'avatar.ios.scss',
    md: 'avatar.md.scss',
  },
  shadow: true,
})
export class Avatar implements ComponentInterface {
  render() {
    return (
      <Host class={getIonMode(this)}>
        <slot />
      </Host>
    );
  }
}
