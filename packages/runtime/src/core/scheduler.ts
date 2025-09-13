import { createLog, createPerformanceTree, throwError } from "@pencil/utils";
import { simpleCustomElementDisplayText } from "src/utils/simpleCustomElementDisplayText.ts";
import {
  componentCtrl,
  PENCIL_COMPONENT_CONTEXT,
} from "../controllers/component.ts";
import type { ComponentInterfaceWithContext } from "./types.ts";
import { render } from "./vdom/render.ts";

const log = createLog("Scheduler");

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
      queueMicrotask(() => void this.flush());
    }
  }

  private async flush() {
    this.isScheduled = false;

    const perf = createPerformanceTree();
    perf.start("render-batch");

    try {
      for (const [component, originalError] of this.pendingRenders) {
        try {
          log("drain", undefined, simpleCustomElementDisplayText(component));

          if (component[PENCIL_COMPONENT_CONTEXT]?.wasRendered) {
            component.componentWillUpdate?.();
          }

          await component.componentWillRender?.();

          const jsx = component.render?.();
          const container = component.shadowRoot || component;

          render(jsx ?? null, container);

          if (!component[PENCIL_COMPONENT_CONTEXT]?.wasRendered) {
            component.componentDidLoad?.();
          }

          component.componentDidRender?.();

          if (component[PENCIL_COMPONENT_CONTEXT]?.wasRendered) {
            component.componentDidUpdate?.();
          } else {
            component[PENCIL_COMPONENT_CONTEXT]!.wasRendered = true;
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
