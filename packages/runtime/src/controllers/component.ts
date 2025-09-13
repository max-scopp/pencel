import { createLog } from "@pencil/utils";

const log = createLog("ComponentsController");

interface ComponentInterface extends HTMLElement {
  // Component's lifecycle method called after rendering
  componentDidRender?(): void;
}

class ComponentsController {
  private componentInstances: Set<ComponentInterface> = new Set();
  private totalComponents: number = 0;
  private initialRenderComplete: boolean = false;

  registerComponent(_component: ComponentInterface): void {
    this.totalComponents++;
    this.componentInstances.add(_component);

    log(
      `Registered component. Total components: ${this.totalComponents}`,
      undefined,
      _component,
    );

    // Component registered for lifecycle management
  }

  /**
   * The component did render - let's announce the component about it.
   */
  doComponentDidRender(component: ComponentInterface): void {
    if (
      this.componentInstances.size === this.totalComponents &&
      !this.initialRenderComplete
    ) {
      this.initialRenderComplete = true;
      // Call componentDidRender on all components
      for (const comp of this.componentInstances) {
        if (comp.componentDidRender) {
          comp.componentDidRender();
        }
      }
    } else {
      // Call componentDidRender for subsequent renders
      if (component.componentDidRender) {
        component.componentDidRender();
      }
    }
  }

  isInitialRenderComplete(): boolean {
    return this.initialRenderComplete;
  }
}

let instance: ComponentsController;

export const componentCtrl = (): ComponentsController => {
  if (!instance) {
    instance = new ComponentsController();
  }
  return instance;
};
