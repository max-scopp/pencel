import { createLog, throwError } from "@pencil/utils";
import type { JSXElement } from "dist/index.js";
import { scheduler } from "../core/scheduler.ts";

const log = createLog("ComponentsController");

export const PENCIL_COMPONENT_CONTEXT: unique symbol = Symbol("__$pencil_ctx$");

export interface CustomElement extends HTMLElement {
  /**
   * Called each time the element is appended into a document-connected element.
   */
  connectedCallback?(): void;

  /**
   * Called each time the element is disconnected from the document's DOM.
   */
  disconnectedCallback?(): void;

  /**
   * Called when one of the element’s observed attributes is added, removed, or changed.
   */
  attributeChangedCallback?(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;

  /**
   * Called each time the element is moved to a new document.
   */
  adoptedCallback?(oldDocument: Document, newDocument: Document): void;
}

export type ConstructablePencilComponent = new (
  ...args: any[]
) => ComponentInterface;

export interface ComponentInterface extends CustomElement {
  [PENCIL_COMPONENT_CONTEXT]?: PencilComponentContext;

  // Component's lifecycle method called after rendering
  componentDidRender?(): void;
  render(): JSXElement;
}

export type PencilComponentPhase = "mounting" | "alive" | "disconnected";

export interface PencilComponentContext {
  phase: PencilComponentPhase;
  props: Map<string | symbol, unknown>;
  state: Map<string | symbol, unknown>;
}

class ComponentsController {
  private componentInstances: WeakMap<
    ComponentInterface,
    PencilComponentContext
  > = new WeakMap();
  private totalComponents: number = 0;
  private initialRenderComplete: boolean = false;

  setInstance(component: ComponentInterface): void {
    if (this.componentInstances.has(component)) {
      log(`Component instance already registered`, undefined, component);
      return; // Already registered
    }

    this.totalComponents++;

    component[PENCIL_COMPONENT_CONTEXT] = {
      phase: "mounting",
      props: new Map(),
      state: new Map(),
    };

    this.componentInstances.set(component, component[PENCIL_COMPONENT_CONTEXT]);

    log(`Register ${component.constructor.name}`);
  }

  /**
   * The component did render - let's announce the component about it.
   */
  doComponentDidRender(component: ComponentInterface): void {
    component.componentDidRender?.();
  }

  markForChanges(component: ComponentInterface, reasons: string[]): void {
    log(
      `Marking component for changes. Reasons: ${reasons.join(", ")}`,
      undefined,
      component,
    );
    scheduler().scheduleUpdate(component);
  }

  /**
   * Gets or lazily registers a component and returns its reactive context
   */
  private getOrRegisterLazy(
    component: ComponentInterface,
  ): PencilComponentContext {
    const ctx = this.componentInstances.get(component);

    if (ctx) {
      return ctx;
    }

    this.setInstance(component);

    return (
      this.componentInstances.get(component) ??
      throwError(`Failed to register component: ${component.tagName}`)
    );
  }

  getProp<TValue>(
    component: ComponentInterface,
    propName: string | symbol,
  ): TValue {
    const ctx = this.getOrRegisterLazy(component);
    return ctx.props.get(propName) as TValue;
  }

  setProp<TValue>(
    component: ComponentInterface,
    propName: string | symbol,
    value: TValue,
  ): void {
    const ctx = this.getOrRegisterLazy(component);
    ctx.props.set(propName, value);
    this.markForChanges(component, [`prop '${String(propName)}' changed`]);

    // // Reflect to attribute if needed
    // const propOptions = this[PENCIL_REACTIVE_CONTEXT]?.get(propertyName);
    // if (propOptions?.reflect) {
    //   if (value == null) {
    //     this.removeAttribute(propertyName);
    //   } else {
    //     this.setAttribute(propertyName, String(value));
    //   }
    // }
  }

  getState<TValue>(
    component: ComponentInterface,
    stateName: string | symbol,
  ): TValue {
    const ctx = this.getOrRegisterLazy(component);
    return ctx.state.get(stateName) as TValue;
  }

  setState<TValue>(
    component: ComponentInterface,
    stateName: string | symbol,
    value: TValue,
  ): void {
    const ctx = this.getOrRegisterLazy(component);
    ctx.state.set(stateName, value);
    this.markForChanges(component, [`state '${String(stateName)}' changed`]);
  }

  /**
   * Sets the phase of a component to "disconnected"
   */
  disconnectComponent(component: ComponentInterface): void {
    const ctx = this.componentInstances.get(component);
    if (ctx) {
      ctx.phase = "disconnected";
      log(`Component phase changed to "disconnected"`, undefined, component);
    }
  }
}

let instance: ComponentsController;

export const componentCtrl = (): ComponentsController => {
  if (!instance) {
    instance = new ComponentsController();
  }
  return instance;
};
