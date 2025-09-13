import { createLog } from "@pencil/utils";
import type {
  ComponentInterfaceWithContext,
  ConstructablePencilComponent,
  PencilComponentPhase,
} from "src/core/types.ts";
import type { PropOptions } from "src/decorators/prop.ts";
import { resolveAttributeName } from "src/utils/attributes.ts";
import { simpleCustomElementDisplayText } from "src/utils/simpleCustomElementDisplayText.ts";
import { scheduler } from "../core/scheduler.ts";

const log = createLog("ComponentsController");

export const PENCIL_COMPONENT_CONTEXT: unique symbol = Symbol("__$pencil_ctx$");
export const PENCIL_OBSERVED_ATTRIBUTES: unique symbol =
  Symbol("__$pencil_obsattr$");

export interface PencilComponentContext {
  phase: PencilComponentPhase;
  wasRendered: boolean;
  extends?: string;
  props: Map<string | symbol, unknown>;
  popts: Map<string | symbol, PropOptions | undefined>;
  state: Map<string | symbol, unknown>;
}

class ComponentsController {
  private cmpts: Set<ComponentInterfaceWithContext> = new Set();

  announceInstance(
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

    this.cmpts.add(component);
  }

  doStabilized(component: ComponentInterfaceWithContext): void {
    this.announceInstance(component);

    const ctx = component[PENCIL_COMPONENT_CONTEXT]!;
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
      ctx?.props.get(propName) ?? meta?.get(propName)?.defaultValue;

    return resolved as TValue;
  }

  setProp<TValue>(
    component: ComponentInterfaceWithContext,
    propName: string | symbol,
    newValue: TValue,
  ): void {
    this.announceInstance(component);

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

  initProp(
    component: ComponentInterfaceWithContext,
    propName: string | symbol,
    propOptions?: PropOptions,
  ): void {
    this.announceInstance(component);

    component[PENCIL_COMPONENT_CONTEXT]?.popts.set(propName, propOptions);

    const attrName = resolveAttributeName(propName, propOptions);

    const cnstrctr = component.constructor as ConstructablePencilComponent;

    cnstrctr[PENCIL_OBSERVED_ATTRIBUTES] ??= [];
    cnstrctr[PENCIL_OBSERVED_ATTRIBUTES].push(attrName);

    this.setProp(component, propName, undefined);
  }

  getState<TValue>(
    component: ComponentInterfaceWithContext,
    stateName: string | symbol,
  ): TValue {
    this.announceInstance(component);

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

  /**
   * Sets the phase of a component to "disconnected"
   */
  disconnectComponent(component: ComponentInterfaceWithContext): void {
    component.disconnectedCallback?.();
    component[PENCIL_COMPONENT_CONTEXT]!.phase = "disconnected";
    this.cmpts.delete(component);
    log(`Delete disconnected component`, undefined, component);
  }

  doComponentWillLoad(component: ComponentInterfaceWithContext): void {
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
