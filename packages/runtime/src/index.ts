export type { PencelRuntimeConfig as PencilRuntimeConfig } from "./config.ts";
export { pencelInit as pencilInit } from "./config.ts";
export type { h } from "./core/jsx/jsx.ts";
export { Host } from "./core/jsx/jsx-dx.ts";
export type * from "./core/types.ts";
export { render } from "./core/vdom/render.ts";
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
  return Promise.resolve().then(cb);
}

export function writeTask<T>(cb: () => T): Promise<T> {
  return Promise.resolve().then(cb);
}

export function forceUpdate(el: HTMLElement): void {
  console.warn("forceUpdate is not implemented yet");
}
