import { createLog } from "@pencel/utils";
import { simpleCustomElementDisplayText } from "../utils/simpleCustomElementDisplayText.ts";
import type { ComponentInterfaceWithContext } from "./types.ts";

const slotLog = createLog("Slots");

export const slotProjectionSymbol = Symbol("_$pen_slot_projection");

interface SlotProjectionState {
  lightChildren: Node[];
}

/**
 * Store light-DOM children on component instance for slot projection.
 */
export function prepareLightDOMSlots(host: Element): void {
  const record = host as Element & Record<symbol, SlotProjectionState | undefined>;
  if (record[slotProjectionSymbol]) return;
  record[slotProjectionSymbol] = { lightChildren: Array.from(host.childNodes) };
}

/**
 * Update cached light-DOM children, filtering out slot elements.
 */
export function updateLightDOMSlots(host: Element): void {
  const state = (host as Element & Record<symbol, SlotProjectionState | undefined>)[slotProjectionSymbol];
  if (!state) return;
  state.lightChildren = Array.from(host.childNodes).filter((n) => !(n instanceof HTMLSlotElement));
}

/**
 * Project user-provided content or fallback into the slot.
 */
export function projectSlot(slot: HTMLSlotElement, host: ComponentInterfaceWithContext): Node[] {
  const state = (host as unknown as Element & Record<symbol, SlotProjectionState | undefined>)[slotProjectionSymbol];
  if (!state) return Array.from(slot.childNodes);

  const slotName = slot.getAttribute("name") || "default";
  const isDefault = slotName === "default";

  const projected = state.lightChildren.filter((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return isDefault;
    const el = node as Element;
    return isDefault ? !el.hasAttribute("slot") : el.getAttribute("slot") === slotName;
  });

  if (projected.length > 0) {
    slotLog(
      `${simpleCustomElementDisplayText(host as ComponentInterfaceWithContext)} ${isDefault ? "default" : `'${slotName}'`} → content`,
    );
    return projected;
  }

  const fallback = Array.from(slot.childNodes);
  if (fallback.length > 0) {
    slotLog(
      `${simpleCustomElementDisplayText(host as ComponentInterfaceWithContext)} ${isDefault ? "default" : `'${slotName}'`} → fallback`,
    );
  }
  return fallback;
}

/**
 * Type guard for slot elements.
 */
export function isProjectableSlot(el: unknown): el is HTMLSlotElement {
  return el instanceof HTMLSlotElement;
}
