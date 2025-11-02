import { Component, type ComponentInterface, Event, Host, Prop, State } from "@pencel/runtime";

@Component({
  tag: "pen-tabs",
})
export class PenTabsElement extends HTMLElement implements ComponentInterface {
  @Prop() activeTab: string = "";
  @Prop() variant: "default" | "pills" | "underline" = "default";
  @Prop() size: "sm" | "md" | "lg" = "md";

  @State() selectedTab: string = "";

  @Event() tabChange: CustomEvent<string>;

  componentDidLoad() {
    if (this.activeTab) {
      this.selectedTab = this.activeTab;
    }
  }

  selectTab = (tabId: string) => {
    this.selectedTab = tabId;
    this.tabChange.emit(tabId);
  };

  render() {
    const variantClass = `tabs-variant-${this.variant}`;
    const sizeClass = `tabs-size-${this.size}`;

    return (
      <Host class={`pen-tabs ${variantClass} ${sizeClass}`}>
        <div class="tabs-header" role="tablist">
          <slot name="tabs" />
        </div>
        <div class="tabs-body">
          <slot />
        </div>
      </Host>
    );
  }
}
