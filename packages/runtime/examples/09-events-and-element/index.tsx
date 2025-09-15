import { Component, type ComponentInterface, render, State } from "../../src";
import { Element } from "../../src/decorators/element";
import { Event, type EventEmitter } from "../../src/decorators/event";

@Component({
  tag: "event-button",
})
class EventButton extends HTMLElement implements ComponentInterface {
  @Event({ bubbles: true })
  clickEvent: EventEmitter<{ timestamp: number }>;

  @Element()
  el: HTMLElement;

  constructor() {
    super();
  }

  connectedCallback() {
    console.log("EventButton connected, element:", this.el);
  }

  handleClick = () => {
    const event = this.clickEvent.emit({ timestamp: Date.now() });
    this.dispatchEvent(event);
    console.log("Emitted custom event:", event);
  };

  render() {
    return (
      <button type="button" onClick={this.handleClick}>
        Emit Custom Event
      </button>
    );
  }
}

@Component({
  tag: "event-counter",
})
class EventCounter extends HTMLElement implements ComponentInterface {
  @State()
  eventCount = 0;

  @State()
  lastEventData: { timestamp: number } | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    // Listen for custom events from event-button
    this.addEventListener("clickevent", this.handleCustomEvent);
  }

  disconnectedCallback() {
    this.removeEventListener("clickevent", this.handleCustomEvent);
  }

  handleCustomEvent = (event: CustomEvent) => {
    this.eventCount++;
    this.lastEventData = event.detail;
    console.log("Received custom event:", event.detail);
  };

  render() {
    return (
      <div class="event-demo">
        <h3>Event Counter</h3>
        <p>
          Events received: <span class="counter">{this.eventCount}</span>
        </p>
        {this.lastEventData && (
          <p>Last event data: {JSON.stringify(this.lastEventData)}</p>
        )}
      </div>
    );
  }
}

@Component({
  tag: "event-demo",
})
class EventDemo extends HTMLElement implements ComponentInterface {
  @State()
  log: string[] = [];

  constructor() {
    super();
  }

  connectedCallback() {
    // Listen for events from child components
    this.addEventListener("clickevent", this.handleGlobalEvent);
  }

  disconnectedCallback() {
    this.removeEventListener("clickevent", this.handleGlobalEvent);
  }

  handleGlobalEvent = (event: CustomEvent) => {
    this.log.push(
      `Global event at ${new Date().toLocaleTimeString()}: ${JSON.stringify(event.detail)}`,
    );
    if (this.log.length > 5) {
      this.log.shift();
    }
  };

  clearLog = () => {
    this.log = [];
  };

  render() {
    return (
      <div class="event-demo">
        <h3>Event Demo</h3>
        <event-button></event-button>
        <event-counter></event-counter>
        <div class="log">
          <h4>Event Log:</h4>
          {this.log.length === 0 ? (
            <p>No events yet</p>
          ) : (
            this.log.map((entry) => <p key={entry}>{entry}</p>)
          )}
          <button type="button" onClick={this.clearLog}>
            Clear Log
          </button>
        </div>
      </div>
    );
  }
}

// Example usage
const app = (
  <div class="container">
    <h1>Pencil Events & Element Example</h1>
    <p>This example demonstrates:</p>
    <ul>
      <li>
        <code>@Event</code> decorator for emitting custom events
      </li>
      <li>
        <code>@Element</code> decorator for accessing the host element
        (deprecated, use <code>this</code> instead)
      </li>
      <li>Event bubbling and listening between components</li>
    </ul>
    <event-demo></event-demo>
  </div>
);

// Render to DOM
const root = document.getElementById("root");
if (root) {
  render(app, root);
}
