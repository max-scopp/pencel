/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: <explanation> */
import { expect, test } from "bun:test";

test("creates a single div", () => {
  const vnode = <div>Hello</div>;
  expect(vnode).toMatchObject({
    tag: "div",
    c: [
      {
        text: "Hello",
      },
    ],
  });
});

test("nested elements", () => {
  const vnode = (
    <div>
      <span>One</span>
      <span>Two</span>
    </div>
  );
  expect(vnode).toMatchObject({
    tag: "div",
    c: [
      { tag: "span", c: [{ text: "One" }] },
      { tag: "span", c: [{ text: "Two" }] },
    ],
  });
});

test("handles fragments", () => {
  const vnode = (
    <>
      <span>A</span>
      <span>B</span>
    </>
  );
  expect(vnode).toMatchObject({
    c: [
      { tag: "span", c: [{ text: "A" }] },
      { tag: "span", c: [{ text: "B" }] },
    ],
  });
});

test("props: normal attributes", () => {
  const vnode = <input type="text" value="foo" />;
  expect(vnode).toMatchObject({
    tag: "input",
    p: { type: "text", value: "foo" },
  });
});

test("props: deprecated attributes", () => {
  // 'class' is deprecated in favor of 'className' in React, but should still work
  const vnode = <div class="foo" />;
  expect(vnode).toMatchObject({
    tag: "div",
    p: { class: "foo" },
  });
});

test("props: aria attributes", () => {
  const vnode = <div aria-label="close" aria-hidden="true" />;
  expect(vnode).toMatchObject({
    tag: "div",
    p: { "aria-label": "close", "aria-hidden": "true" },
  });
});

test("props: className attribute", () => {
  const vnode = <div class="foo bar" />;
  expect(vnode).toMatchObject({
    tag: "div",
    p: { class: "foo bar" },
  });
});

test("props: dataset attributes", () => {
  const vnode = <div data-id="123" data-user="max" />;
  expect(vnode).toMatchObject({
    tag: "div",
    p: { "data-id": "123", "data-user": "max" },
  });
});
