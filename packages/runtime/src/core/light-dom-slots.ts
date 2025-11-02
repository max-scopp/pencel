import { createLog } from "@pencel/utils";

const slotLog = createLog("Slots");

export const slotMutationObserverSymbol = Symbol("_$pen_slot_mutation_observer");

/**
 * Capture light-DOM children from host, excluding placeholder slots.
 * Called BEFORE PASS 1 render, so only captures actual user content.
 */
export function captureExternalLightDOM(host: Element): Node[] {
  const captured: Node[] = [];

  for (const child of host.childNodes) {
    // Skip slot placeholders (from previous render)
    if (child instanceof HTMLSlotElement) {
      continue;
    }

    // Skip text nodes that are just whitespace
    if (child.nodeType === Node.TEXT_NODE) {
      if ((child as Text).data.trim()) {
        captured.push(child);
      }
      continue;
    }

    captured.push(child);
  }

  return captured;
}

/**
 * Walk entire component tree and collect all slot placeholder elements.
 */
export function identifyPlaceholders(host: Element): Map<string, HTMLSlotElement> {
  const placeholders = new Map<string, HTMLSlotElement>();
  const slots = host.querySelectorAll("slot");

  for (const slot of slots) {
    const slotName = slot.getAttribute("name") || "default";
    placeholders.set(slotName, slot);
  }

  return placeholders;
}

/**
 * Match light-DOM content to slots based on slot name and slot attribute.
 * Returns mapping of slot name to projected nodes (cloned to avoid DOM hierarchy issues).
 */
export function projectIntoPlaceholders(
  placeholders: Map<string, HTMLSlotElement>,
  lightDOM: Node[],
): Map<string, Node[]> {
  const projection = new Map<string, Node[]>();

  for (const [slotName, placeholder] of placeholders) {
    const isDefault = slotName === "default";

    // Filter light-DOM for this slot
    const content = lightDOM.filter((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return isDefault;
      }

      const el = node as Element;
      if (isDefault) {
        // Default slot: elements without slot attribute
        return !el.hasAttribute("slot");
      }
      // Named slot: elements with slot={slotName}
      return el.getAttribute("slot") === slotName;
    });

    // Use projected content if available, otherwise use placeholder's fallback
    if (content.length > 0) {
      slotLog(`${isDefault ? "default" : `'${slotName}'`} → projected`);
      // Clone nodes early to avoid DOM hierarchy issues when appendChild is called
      const cloned = content.map((node) => node.cloneNode(true));
      projection.set(slotName, cloned);
    } else {
      const fallback = Array.from(placeholder.childNodes);
      if (fallback.length > 0) {
        slotLog(`${isDefault ? "default" : `'${slotName}'`} → fallback`);
      }
      projection.set(slotName, fallback);
    }
  }

  return projection;
}

/**
 * Replace placeholder slots with projected content in the DOM tree.
 * The projected nodes are already cloned, so just move them into the fragment.
 */
export function commitProjection(placeholders: Map<string, HTMLSlotElement>, projectionMap: Map<string, Node[]>): void {
  for (const [slotName, placeholder] of placeholders) {
    const content = projectionMap.get(slotName) || [];
    const parent = placeholder.parentElement;

    if (!parent) continue;

    // Create fragment and append already-cloned nodes
    const fragment = document.createDocumentFragment();
    for (const node of content) {
      fragment.appendChild(node);
    }

    // Replace placeholder with projected content
    parent.replaceChild(fragment, placeholder);
  }
}

/**
 * Clean up orphaned placeholder slots that were replaced during projection.
 * Note: Light-DOM nodes are NOT removed - they remain for reactivity and external mutation detection.
 * This function is a no-op since commitProjection already removes the slot placeholders.
 */
export function cleanupOrphanedNodes(_host: Element, _projectionMap: Map<string, Node[]>): void {
  // With cloning strategy, we don't remove light-DOM nodes
  // They stay in place and are available for re-projection on next render
  // The slot placeholders are already removed by commitProjection
}

/**
 * Temporarily disable the MutationObserver to prevent internal DOM mutations from triggering renders.
 */
export function pauseExternalChangeDetection(host: Element): void {
  const observerRecord = host as Element & Record<symbol, MutationObserver | undefined>;
  const observer = observerRecord[slotMutationObserverSymbol];
  if (observer) {
    observer.disconnect();
  }
}

/**
 * Re-enable the MutationObserver after internal DOM mutations.
 */
export function resumeExternalChangeDetection(host: Element): void {
  const observerRecord = host as Element & Record<symbol, MutationObserver | undefined>;
  const observer = observerRecord[slotMutationObserverSymbol];
  if (observer) {
    observer.observe(host, {
      childList: true,
      subtree: false,
    });
  }
}

/**
 * Set up MutationObserver to detect external light-DOM changes and trigger render.
 */
export function setupExternalChangeDetection(host: Element, onLightDOMChange: (host: Element) => void): void {
  const observerRecord = host as Element & Record<symbol, MutationObserver | undefined>;
  if (observerRecord[slotMutationObserverSymbol]) {
    return; // Already set up
  }

  const observer = new MutationObserver(() => {
    slotLog("external light-DOM change detected, triggering render");
    onLightDOMChange(host);
  });

  observer.observe(host, {
    childList: true,
    subtree: false,
  });

  observerRecord[slotMutationObserverSymbol] = observer;
}

/**
 * Type guard for slot elements.
 */
export function isProjectableSlot(el: unknown): el is HTMLSlotElement {
  return el instanceof HTMLSlotElement;
}
