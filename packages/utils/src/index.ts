export * from "./coordinated-logging.ts";
export * from "./createPerformanceTree.ts";
export * from "./dashCase.ts";
export * from "./getExtendsByInheritance.ts";
export * from "./getTagByExtendsString.ts";
export * from "./isBrowser.ts";
export * from "./log.ts";
export * from "./throwConsumerError.ts";
export * from "./throwError.ts";
export * from "./throwWithCodeFrame.ts";

declare global {
  var PENCIL_DEBUG: boolean;
}
