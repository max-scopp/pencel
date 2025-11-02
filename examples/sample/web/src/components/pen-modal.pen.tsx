import { Component, type ComponentInterface, Event, Host, Prop, State } from "@pencel/runtime";

@Component({
  tag: "pen-modal",
})
export class PenModalElement extends HTMLElement implements ComponentInterface {
  @Prop() open: boolean = false;
  @Prop() heading: string = "";
  @Prop() size: "sm" | "md" | "lg" | "xl" = "md";
  @Prop() closeButton: boolean = true;
  @Prop() backdrop: boolean = true;
  @Prop() backdropClickClose: boolean = true;

  @State() isOpen: boolean = false;

  @Event() openChange: CustomEvent<boolean>;
  @Event() close: CustomEvent<void>;

  componentDidLoad() {
    this.isOpen = this.open;
  }

  componentDidUpdate() {
    if (this.open !== this.isOpen) {
      this.isOpen = this.open;
    }
  }

  handleClose = () => {
    this.isOpen = false;
    this.close.emit();
    this.openChange.emit(false);
  };

  handleBackdropClick = () => {
    if (this.backdropClickClose) {
      this.handleClose();
    }
  };

  render() {
    const sizeClass = `modal-size-${this.size}`;
    const isOpenClass = this.isOpen ? "modal-open" : "";

    return (
      <Host class={`pen-modal ${isOpenClass}`}>
        {this.backdrop && <div class="modal-backdrop" onClick={this.handleBackdropClick} role="presentation" />}
        <div class={`modal-content ${sizeClass}`} role="dialog">
          {this.heading && (
            <div class="modal-header">
              <h2 class="modal-title">{this.heading}</h2>
              {this.closeButton && (
                <button class="modal-close-button" onClick={this.handleClose} aria-label="Close modal">
                  ✕
                </button>
              )}
            </div>
          )}
          <div class="modal-body">
            <slot />
          </div>
        </div>
      </Host>
    );
  }
}
