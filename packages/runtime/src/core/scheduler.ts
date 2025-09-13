import { createPerformanceTree } from "@pencil/utils";

export class ComponentUpdateScheduler {
  private pendingRenders = new Set<() => void>();
  private isScheduled = false;

  scheduleUpdate(renderFn: () => void): void {
    this.pendingRenders.add(renderFn);
    this.scheduleFlush();
  }

  scheduleRender(renderFn: () => void): void {
    this.pendingRenders.add(renderFn);
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
      for (const render of this.pendingRenders) {
        render();
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
