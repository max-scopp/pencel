import { createLog } from "@pencil/utils";
import type {
  ComponentInterface,
  PencilComponentPhase,
} from "src/core/types.ts";
import type { PropOptions } from "src/decorators/prop.ts";
import { simpleCustomElementDisplayText } from "src/utils/simpleCustomElementDisplayText.ts";
import { scheduler } from "../core/scheduler.ts";

const log = createLog("ComponentsController");

export const PENCIL_COMPONENT_CONTEXT: unique symbol = Symbol("__$pencil_ctx$");
export const PENCIL_OBSERVED_ATTRIBUTES: unique symbol =
  Symbol("__$pencil_obsattr$");

export interface PencilComponentContext {
  phase: PencilComponentPhase;
  extends?: string;
  props: Map<string | symbol, unknown>;
  popts: Map<string | symbol, PropOptions | undefined>;
  state: Map<string | symbol, unknown>;
}

class ComponentsController {
  private cmpts: Set<ComponentInterface> = new Set();

  announceInstance(
    component: ComponentInterface,
    customElementExtends?: string,
  ): void {
    component[PENCIL_COMPONENT_CONTEXT] ??= {
      extends: customElementExtends,
      phase: "mounting",
      props: new Map(),
      popts: new Map(),
      state: new Map(),
    };

    this.cmpts.add(component);
  }

  /**
   * The component did render - let's announce the component about it.
   */
  doComponentDidRender(component: ComponentInterface): void {
    component.componentDidRender?.();
  }

  doStabilized(component: ComponentInterface): void {
    this.announceInstance(component);

    const ctx = component[PENCIL_COMPONENT_CONTEXT]!;
    ctx.phase = "alive";

    component.componentDidLoad?.();
    this.markForChanges(component, ["mount"]);
  }

  markForChanges(component: ComponentInterface, reasons: string[]): void {
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
    component: ComponentInterface,
    propName: string | symbol,
  ): TValue {
    const ctx = component[PENCIL_COMPONENT_CONTEXT];
    const meta = ctx?.popts;

    const resolved =
      ctx?.props.get(propName) ?? meta?.get(propName)?.defaultValue;

    return resolved as TValue;
  }

  setProp<TValue>(
    component: ComponentInterface,
    propName: string | symbol,
    value: TValue,
  ): void {
    this.announceInstance(component);

    component[PENCIL_COMPONENT_CONTEXT]?.props.set(propName, value);
    this.markForChanges(component, [`prop '${String(propName)}' changed`]);
  }

  initProp(
    component: ComponentInterface,
    propName: string | symbol,
    options?: PropOptions,
  ): void {
    this.announceInstance(component);

    component[PENCIL_COMPONENT_CONTEXT]?.popts.set(propName, options);
    this.setProp(component, propName, undefined);
  }

  getState<TValue>(
    component: ComponentInterface,
    stateName: string | symbol,
  ): TValue {
    this.announceInstance(component);

    return component[PENCIL_COMPONENT_CONTEXT]?.state.get(stateName) as TValue;
  }

  setState<TValue>(
    component: ComponentInterface,
    stateName: string | symbol,
    value: TValue,
  ): void {
    component[PENCIL_COMPONENT_CONTEXT]?.state.set(stateName, value);
    this.markForChanges(component, [`state '${String(stateName)}' changed`]);
  }

  /**
   * Sets the phase of a component to "disconnected"
   */
  disconnectComponent(component: ComponentInterface): void {
    component.disconnectedCallback?.();
    component[PENCIL_COMPONENT_CONTEXT]!.phase = "disconnected";
    this.cmpts.delete(component);
    log(`Delete disconnected component`, undefined, component);
  }

  doComponentWillLoad(component: ComponentInterface): void {
    component.componentWillLoad?.();
    this.markForChanges(component, ["mount"]);
  }
}

let instance: ComponentsController;

export const componentCtrl = (): ComponentsController => {
  if (!instance) {
    instance = new ComponentsController();
  }
  return instance;
};
