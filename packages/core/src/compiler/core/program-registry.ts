import type { PencilSourceFileRegistry } from "./pencel-source-file-registry.ts";

export let pencilRegistry: PencilSourceFileRegistry | null = null;

export function setPencilRegistry(registry: PencilSourceFileRegistry): void {
  pencilRegistry = registry;
}

export function getPencilRegistry(): PencilSourceFileRegistry {
  if (!pencilRegistry) {
    throw new Error(
      "Pencel registry not initialized. Call setPencilRegistry first.",
    );
  }
  return pencilRegistry;
}
