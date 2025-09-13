import { createPerformanceTree } from "@pencil/utils";
import type { ComponentInterface } from "../controllers/component.ts";
import { render } from "./vdom/render.ts";

export class ComponentUpdateScheduler {
  private pendingRenders = new Map<ComponentInterface, Error>();
  private isScheduled = false;

  scheduleUpdate(component: ComponentInterface): void {
    if (this.pendingRenders.has(component)) {
      return;
    }

    const stackTrace = new Error("[UPDATE] Source of scheduling");
    this.pendingRenders.set(component, stackTrace);
    this.scheduleFlush();
  }

  scheduleRender(component: ComponentInterface): void {
    if (this.pendingRenders.has(component)) {
      return;
    }

    const stackTrace = new Error("[RENDER] Source of scheduling");
    this.pendingRenders.set(component, stackTrace);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (!this.isScheduled) {
      this.isScheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  private flush(): void {
    this.isScheduled = false;

    const perf = createPerformanceTree();
    perf.start("render-batch");

    try {
      for (const [renderTarget, originalError] of this.pendingRenders) {
        try {
          const jsx = renderTarget.render();
          const container = renderTarget.shadowRoot || renderTarget;
          render(jsx, container);
        } catch (error) {
          // Create a new error that includes both the current error and the original scheduling context
          const enhancedError = new Error(
            `${String(error)}\n\n${originalError.stack}`,
          );

          throw enhancedError;
        }
      }
    } finally {
      perf.end("render-batch");
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
