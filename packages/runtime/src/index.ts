export type { PencelRuntimeConfig as PencilRuntimeConfig } from "./config.ts";
export { pencelInit } from "./config.ts";
export * from "./core/jsx/jsx-helpers.ts";
export type * from "./core/jsx/types.ts";
export type * from "./core/once.ts";
export type * from "./core/types.ts";
export { renderVNode } from "./core/vdom/renderVNode.ts";
export type * from "./core/vdom/types.ts";
export * from "./decorators/component.ts";
export * from "./decorators/element.ts";
export * from "./decorators/event.ts";
export * from "./decorators/listen.ts";
export * from "./decorators/method.ts";
export * from "./decorators/prop.ts";
export * from "./decorators/state.ts";
export * from "./decorators/store.ts";
export * from "./decorators/watch.ts";

export function readTask<T>(cb: () => T): Promise<T> {
  console.warn("readTask is not implemented yet");
  return Promise.resolve().then(cb);
}

export function writeTask<T>(cb: () => T): Promise<T> {
  console.warn("writeTask is not implemented yet");
  return Promise.resolve().then(cb);
}

export function forceUpdate(el: HTMLElement): void {
  console.warn("forceUpdate is not implemented yet");
}
