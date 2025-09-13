import { scheduler } from "../scheduler.ts";
import { type RenderContainer, render } from "./render.ts";
import type { JSXElement } from "./types.ts";

export function scheduleRender(
  jsx: JSXElement,
  container: RenderContainer,
): void {
  scheduler().scheduleRender(() => {
    render(jsx, container);
  });
}
