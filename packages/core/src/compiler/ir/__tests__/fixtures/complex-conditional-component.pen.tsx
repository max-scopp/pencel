/// <reference types="@pencel/runtime" />

export class ComplexConditionalComponent {
  status: "idle" | "loading" | "success" | "error" = "idle";
  data: unknown[] = [];
  errorMessage: string = "";

  render() {
    return (
      <div class={`status-container status-${this.status}`}>
        {this.status === "loading" ? (
          <span class="spinner">Loading...</span>
        ) : this.status === "success" ? (
          <div>
            {this.data.length > 0 ? (
              <ul>
                {this.data.map((item, idx) => (
                  <li key={idx}>{String(item)}</li>
                ))}
              </ul>
            ) : (
              <p>No data available</p>
            )}
          </div>
        ) : this.status === "error" ? (
          <div class="error-box">
            <p>Error: {this.errorMessage}</p>
          </div>
        ) : (
          <p>Ready to start</p>
        )}
      </div>
    );
  }
}
