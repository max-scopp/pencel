import {
  createLog,
  createPerformanceTree,
  throwConsumerError,
  throwError,
} from "@pencil/utils";
import { debug } from "console";
import { simpleCustomElementDisplayText } from "src/utils/simpleCustomElementDisplayText.ts";
import type { ComponentInterface } from "../controllers/component.ts";
import { render } from "./vdom/render.ts";

const log = createLog("Scheduler");

export class ComponentUpdateScheduler {
  private pendingRenders = new Map<ComponentInterface, Error>();
  private isScheduled = false;

  schedule(component: ComponentInterface): void {
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

  private flush(): void {
    this.isScheduled = false;

    const perf = createPerformanceTree();
    perf.start("render-batch");

    try {
      for (const [renderTarget, originalError] of this.pendingRenders) {
        try {
          log("drain", undefined, simpleCustomElementDisplayText(renderTarget));

          const jsx = renderTarget.render();
          const container = renderTarget.shadowRoot || renderTarget;
          render(jsx, container);
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
