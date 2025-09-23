import { ConsumerError, createLog, throwError } from "@pencel/utils";
import { scheduler } from "../core/scheduler.ts";
import { PENCIL_COMPONENT_CONTEXT } from "../core/symbols.ts";
import type {
  ComponentInterfaceWithContext,
  PencilComponentPhase,
} from "../core/types.ts";
import type { PropOptions } from "../decorators/prop.ts";
import { throwNoContext } from "../panics/throwNoContext.ts";
import { simpleCustomElementDisplayText } from "../utils/simpleCustomElementDisplayText.ts";

const log = createLog("Components Controller");

export interface PencilComponentContext {
  phase: PencilComponentPhase;
  wasRendered: boolean;
  extends?: string;
  props: Map<string | number | symbol, unknown>;
  popts: Map<string | number | symbol, PropOptions | undefined>;
  state: Map<string | number | symbol, unknown>;
}

class ComponentsController {
  private cmpts: Set<ComponentInterfaceWithContext> = new Set();

  private stores = new WeakMap<
    ComponentInterfaceWithContext,
    Map<string, unknown>
  >();

  connect(
    component: ComponentInterfaceWithContext,
    customElementExtends?: string,
  ): void {
    component[PENCIL_COMPONENT_CONTEXT] ??= {
      extends: customElementExtends,
      phase: "mounting",
      wasRendered: false,
      props: new Map(),
      popts: new Map(),
      state: new Map(),
    };

    // // TODO: Must be removed after debugging
    // if (component.constructor.name !== "PencilCustomElementWrap") {
    //   throw new Error(
    //     `Internal Error: component.constructor.name !== "PencilCustomElementWrap" --- got ${component.constructor.name} instead`,
    //   );
    // }

    this.cmpts.add(component);
  }

  /**
   * Sets the phase of a component to "disconnected"
   */
  disconnect(component: ComponentInterfaceWithContext): void {
    const ctx = component[PENCIL_COMPONENT_CONTEXT] ?? throwNoContext();
    ctx.phase = "disconnected";

    this.cmpts.delete(component);

    log("disconnected", undefined, component);
  }

  markStableAndLoaded(component: ComponentInterfaceWithContext): void {
    const ctx = component[PENCIL_COMPONENT_CONTEXT] ?? throwNoContext();
    ctx.phase = "alive";

    component.componentDidLoad?.();

    this.markForChanges(component, ["mount"]);
  }

  markForChanges(
    component: ComponentInterfaceWithContext,
    reasons: string[],
  ): void {
    // only mark and queue for re-render for components that have been mounted and are still connected
    if (component[PENCIL_COMPONENT_CONTEXT]?.phase !== "alive") {
      return;
    }

    log(
      `🗣️ ${simpleCustomElementDisplayText(component)}`,
      undefined,
      reasons.join(" "),
    );

    scheduler().schedule(component);
  }

  getProp<TValue>(
    component: ComponentInterfaceWithContext,
    propName: string | symbol,
  ): TValue {
    const ctx = component[PENCIL_COMPONENT_CONTEXT];
    const meta = ctx?.popts;

    const resolved =
      ctx?.props.get(propName) ?? meta?.get(propName)?.fallbackValue;

    return resolved as TValue;
  }

  setProp<TValue>(
    component: ComponentInterfaceWithContext,
    propName: string | symbol,
    newValue: TValue,
  ): void {
    const oldValue = this.getProp<TValue>(component, propName);
    component[PENCIL_COMPONENT_CONTEXT]?.props.set(propName, newValue);

    const shouldUpdate = component.componentShouldUpdate?.(
      newValue,
      oldValue,
      propName,
    );

    if (shouldUpdate) {
      this.markForChanges(component, [`prop '${String(propName)}' changed`]);
    }
  }

  getState<TValue>(
    component: ComponentInterfaceWithContext,
    stateName: string | symbol,
  ): TValue {
    // TODO: This should be gone
    this.connect(component);

    return component[PENCIL_COMPONENT_CONTEXT]?.state.get(stateName) as TValue;
  }

  setState<TValue>(
    component: ComponentInterfaceWithContext,
    stateName: string | symbol,
    newValue: TValue,
  ): void {
    const oldValue = this.getState<TValue>(component, stateName);
    component[PENCIL_COMPONENT_CONTEXT]?.state.set(stateName, newValue);

    const shouldUpdate = component.componentShouldUpdate?.(
      newValue,
      oldValue,
      stateName,
    );

    if (shouldUpdate) {
      this.markForChanges(component, [`state '${String(stateName)}' changed`]);
    }
  }

  findStore<TStore>(
    childComponent: ComponentInterfaceWithContext,
    storeName: string,
  ): { store: TStore; component: ComponentInterfaceWithContext } {
    const component = Array.from(this.cmpts).find((cmp) =>
      cmp.contains(childComponent),
    );

    if (!component) {
      throw new ConsumerError(
        `Could not find parent component for ${simpleCustomElementDisplayText(
          childComponent,
        )}. Make sure the component is rendered inside another Pencil component that does provide the store.`,
      );
    }

    const storeContext = this.stores.get(component);

    return {
      component,
      store:
        (storeContext?.get(storeName) as TStore) ??
        throwError("Store not found"),
    };
  }

  getStore<TStore>(
    component: ComponentInterfaceWithContext,
    storeName: string | symbol,
  ): TStore {
    // TODO: This should be gone
    this.connect(component);

    const storeContext = this.stores.get(component) ?? new Map();

    if (!this.stores.has(component)) {
      this.stores.set(component, storeContext);
    }

    return storeContext.get(storeName) as TStore;
  }

  setStore<TStore>(
    component: ComponentInterfaceWithContext,
    storeName: string | symbol,
    newValue: TStore,
  ): void {
    // TODO: This should be gone
    this.connect(component);

    const storeContext = this.stores.get(component) ?? new Map();

    if (!this.stores.has(component)) {
      this.stores.set(component, storeContext);
    }

    const oldValue = storeContext.get(storeName) as TStore;
    storeContext.set(storeName, newValue);

    const shouldUpdate = component.componentShouldUpdate?.(
      newValue,
      oldValue,
      storeName,
    );

    if (shouldUpdate) {
      this.markForChanges(component, [`store '${String(storeName)}' changed`]);
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
