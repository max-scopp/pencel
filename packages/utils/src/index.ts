export * from "./createPerformanceTree.ts";
export * from "./getExtendsByInheritance.ts";
export * from "./isBrowser.ts";
export * from "./log.ts";
export * from "./throwConsumerError.ts";
export * from "./throwError.ts";

declare global {
  var PENCIL_DEBUG: boolean;
}
