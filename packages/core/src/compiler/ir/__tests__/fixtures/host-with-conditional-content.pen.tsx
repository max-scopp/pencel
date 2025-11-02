/// <reference types="@pencel/runtime" />

import { Host } from "@pencel/runtime";

export class HostWithConditionalContent {
  isOpen: boolean = false;
  hasError: boolean = false;

  render() {
    const stateClass = this.isOpen ? "expanded" : "collapsed";
    const errorClass = this.hasError ? "error" : "success";

    return (
      <Host class={`component ${stateClass} ${errorClass}`}>
        {this.isOpen && (
          <div class="expanded-content">
            <slot name="expanded" />
          </div>
        )}
        {!this.isOpen && (
          <div class="collapsed-content">
            <p>Collapsed</p>
          </div>
        )}
        {this.hasError ? (
          <div class="error-message">
            <slot name="error" />
          </div>
        ) : (
          <div class="success-message">All good</div>
        )}
      </Host>
    );
  }
}
