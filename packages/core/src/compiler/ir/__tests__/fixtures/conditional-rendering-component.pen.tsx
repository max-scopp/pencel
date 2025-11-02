/// <reference types="@pencel/runtime" />

export class ConditionalRenderingComponent {
  showContent: boolean = true;
  itemCount: number = 3;
  hasError: boolean = false;

  render() {
    return (
      <div>
        {this.showContent ? (
          <p>Content is visible</p>
        ) : (
          <p>Content is hidden</p>
        )}
        {this.itemCount > 5 ? <strong>Many items</strong> : <em>Few items</em>}
        {this.hasError && <span class="error-alert">Error occurred!</span>}
        {!this.hasError && <span class="success">All good</span>}
      </div>
    );
  }
}
