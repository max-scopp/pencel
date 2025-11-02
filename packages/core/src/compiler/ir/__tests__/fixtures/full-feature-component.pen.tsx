/// <reference types="@pencel/runtime" />

export class FullFeatureComponent {
  // Props
  title: string = "Component Title";
  disabled: boolean = false;

  // State
  isOpen: boolean = false;
  selectedIndex: number = -1;

  // Methods
  handleOpen = () => {
    this.isOpen = true;
  };

  handleClose = () => {
    this.isOpen = false;
  };

  handleSelect = (index: number) => {
    this.selectedIndex = index;
  };

  render() {
    const headerClass = this.isOpen ? "expanded" : "collapsed";
    const isSelected = this.selectedIndex >= 0;

    return (
      <div class={`component ${headerClass}`}>
        <header>
          <h2>{this.title}</h2>
          <button
            onClick={this.handleOpen}
            disabled={this.disabled || this.isOpen}
          >
            Open
          </button>
        </header>
        {this.isOpen && (
          <div class="content">
            <button onClick={this.handleClose}>Close</button>
            {isSelected ? (
              <p>Selected: Item {this.selectedIndex}</p>
            ) : (
              <p>No selection</p>
            )}
          </div>
        )}
      </div>
    );
  }
}
