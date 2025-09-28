import {
  ConsumerError,
  createPerformanceTree,
  throwError,
} from "@pencel/utils";
import { PENCIL_COMPONENT_CONTEXT } from "./symbols.ts";
import type { ComponentInterfaceWithContext } from "./types.ts";
import { renderVNode } from "./vdom/renderVNode.ts";

export class ComponentUpdateScheduler {
  private pendingRenders = new Map<ComponentInterfaceWithContext, Error>();
  private isScheduled = false;

  schedule(component: ComponentInterfaceWithContext): void {
    if (this.pendingRenders.has(component)) {
      return;
    }

    const stackTrace = new Error("(Scheduled Source)");
    this.pendingRenders.set(component, stackTrace);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (!this.isScheduled) {
      this.isScheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  private async flush(): Promise<void> {
    this.isScheduled = false;

    const perf = createPerformanceTree("Scheduler");
    perf.start("total-render-time");

    try {
      for (const [component, originalError] of this.pendingRenders) {
        try {
          const ctx = component[PENCIL_COMPONENT_CONTEXT];

          if (!ctx) {
            throw new ConsumerError(
              `Missing component context on ${component.constructor.name}. Did you forget to call super() in the constructor?`,
            );
          }

          if (ctx.wasRendered) {
            component.componentWillUpdate?.();
          }

          await component.componentWillRender?.();

          const vnodes = component.render?.();
          const container = component.shadowRoot || component;

          if (vnodes) {
            renderVNode(vnodes, container);
          }

          if (!ctx.wasRendered) {
            component.componentDidLoad?.();
          }

          component.componentDidRender?.();

          if (ctx.wasRendered) {
            component.componentDidUpdate?.();
          } else {
            ctx.wasRendered = true;
          }
        } catch (error) {
          throwError(
            (error instanceof Error
              ? (error.stack ?? String(error))
              : String(error)) +
              "\n\n" +
              originalError,
          );
        }
      }
    } finally {
      perf.end("total-render-time");
      perf.log();
      this.pendingRenders.clear();
    }
  }
}

let instance: ComponentUpdateScheduler;
export const scheduler = (): ComponentUpdateScheduler => {
  if (!instance) {
    instance = new ComponentUpdateScheduler();
  }
  return instance;
};
